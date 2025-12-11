const Teacher = require('../models/Teacher');
const User = require('../models/User');

const createTeacher = async (req, res) => {
    const { fullName, position, department, email, phone, password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Необхідно вказати пароль для облікового запису' });
    }

    try {
        const teacher = new Teacher({ fullName, position, department, email, phone });
        await teacher.save();

        const user = await User.create({
            email,
            password,
            role: 'teacher',
            teacherId: teacher._id,
        });

        res.status(201).json({
            ...teacher.toObject({ getters: true }),
            hasAccount: true
        });

    } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000) {
            await Teacher.deleteOne({ email: req.body.email });
        }
        res.status(400).json({ message: error.message });
    }
};

const processTeachers = (teachers, user) => {
    const role = user ? user.role : 'guest';

    if (role === 'admin' || role === 'student') {
        return teachers.map(t => {
            const teacherObj = t.toObject({ getters: true });
            teacherObj.email = t.viewEmail;
            return teacherObj;
        });
    }
    return teachers;
};

const getTeachers = async (req, res) => {
    try {
        const role = req.user ? req.user.role : 'guest';
        const needsEmail = (role === 'admin' || role === 'student');

        const teachers = needsEmail
            ? await Teacher.find({}).select('+email')
            : await Teacher.find({});

        res.status(200).json(processTeachers(teachers, req.user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTeacher = async (req, res) => {
    try {
        const role = req.user ? req.user.role : 'guest';
        const needsEmail = (role === 'admin' || role === 'student');
        let query = Teacher.findById(req.params.id);

        if (needsEmail) {
            query = query.select('+email');
        }

        const teacher = await query;

        if (!teacher) {
            return res.status(404).json({ message: 'Викладача не знайдено' });
        }

        const result = processTeachers([teacher], req.user);
        res.status(200).json(result[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateTeacher = async (req, res) => {
    const { password, ...updateData } = req.body;

    try {
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('+email');

        if (!teacher) {
            return res.status(404).json({ message: 'Викладача не знайдено' });
        }

        const user = await User.findOne({ teacherId: teacher._id }).select('+password');

        if (user) {
            let isModified = false;

            if (teacher.email && user.email !== teacher.email) {
                user.email = teacher.email;
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

        const result = processTeachers([teacher], req.user);
        res.status(200).json(result[0]);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).select('+email');

        if (!teacher) {
            return res.status(404).json({ message: 'Викладача не знайдено' });
        }

        const teacherEmail = teacher.email;
        const teacherFullName = teacher.fullName;

        await Teacher.deleteOne({ _id: req.params.id });

        const userDeleted = await User.deleteOne({ email: teacherEmail });

        res.status(200).json({
            message: 'Викладача та пов\'язаний обліковий запис успішно видалено',
            deletedTeacher: teacherFullName
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTeacher,
    getTeachers,
    getTeacher,
    updateTeacher,
    deleteTeacher,
};
