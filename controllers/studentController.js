const Student = require('../models/Student');
const Group = require('../models/Group');
const User = require('../models/User');

const createStudent = async (req, res) => {
    const { group: groupId, email, password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Необхідно вказати пароль для облікового запису' });
    }

    try {
        const targetGroup = await Group.findById(groupId);
        if (!targetGroup) {
            return res.status(404).json({ message: 'Групу не знайдено.' });
        }

        const currentCount = await Student.countDocuments({ group: groupId });

        if (currentCount >= targetGroup.studentsCount) {
            return res.status(400).json({
                message: `Помилка: Група переповнена! Ліміт: ${targetGroup.studentsCount}, Зараз: ${currentCount}`
            });
        }

        const student = new Student(req.body);
        await student.save();

        const user = await User.create({
            email,
            password,
            role: 'student',
            studentId: student._id,
        });

        const createdStudent = await Student.findById(student._id).populate('group', 'name');
        res.status(201).json(createdStudent);

    } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000) {
            await Student.deleteOne({ email: req.body.email });
        }
        res.status(400).json({ message: error.message });
    }
};

const processStudents = (students, user) => {
    const role = user ? user.role : 'guest';

    if (role === 'admin' || role === 'teacher') {
        return students.map(s => {
            const studentObj = s.toObject({ getters: true });
            studentObj.email = s.viewEmail;
            return studentObj;
        });
    }
    return students;
};

const getStudents = async (req, res) => {
    try {
        const role = req.user ? req.user.role : 'guest';
        const needsEmail = (role === 'admin' || role === 'teacher');

        const students = needsEmail
            ? await Student.find({}).populate('group', 'name course').select('+email')
            : await Student.find({}).populate('group', 'name course');

        res.status(200).json(processStudents(students, req.user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStudent = async (req, res) => {
    try {
        const role = req.user ? req.user.role : 'guest';
        const needsEmail = (role === 'admin' || role === 'teacher');

        let query = Student.findById(req.params.id).populate('group', 'name course');

        if (needsEmail) {
            query = query.select('+email');
        }

        const student = await query;

        if (!student) {
            return res.status(404).json({ message: 'Студента не знайдено' });
        }

        const result = processStudents([student], req.user);
        res.status(200).json(result[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateStudent = async (req, res) => {
    const { password, ...updateData } = req.body;

    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('+email');

        if (!student) {
            return res.status(404).json({ message: 'Студента не знайдено' });
        }

        const user = await User.findOne({ studentId: student._id }).select('+password');

        if (user) {
            let isModified = false;

            if (student.email && user.email !== student.email) {
                user.email = student.email;
                isModified = true;
            }

            if (password && password.trim().length > 0) {
                user.password = password;
                isModified = true;
            }

            if (isModified) {
                await user.save();
            }
        }

        const result = processStudents([student], req.user);
        res.status(200).json(result[0]);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('+email');

        if (!student) {
            return res.status(404).json({ message: 'Студента не знайдено' });
        }

        const studentEmail = student.email;
        const studentFullName = student.fullName;

        await Student.deleteOne({ _id: req.params.id });

        const userDeleted = await User.deleteOne({ email: studentEmail });

        res.status(200).json({
            message: 'Студента та пов\'язаний обліковий запис успішно видалено',
            deletedStudent: studentFullName
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createStudent,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent,
};
