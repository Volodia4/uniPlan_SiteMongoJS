const Group = require('../models/Group');
const Student = require('../models/Student');
const User = require('../models/User');
const Load = require('../models/Load');
const Schedule = require('../models/Schedule');

const createGroup = async (req, res) => {
    try {
        if (req.body.course < 1 || req.body.course > 6) {
            return res.status(400).json({ message: 'Курс має бути від 1 до 6' });
        }
        const group = new Group(req.body);
        await group.save();
        res.status(201).json(group);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Група з такою назвою вже існує.' });
        }
        res.status(400).json({ message: error.message });
    }
};

const getGroups = async (req, res) => {
    try {
        const groups = await Group.find({});
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!group) {
            return res.status(404).json({ message: 'Групу не знайдено' });
        }
        res.status(200).json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Групу не знайдено' });
        }

        const students = await Student.find({ group: groupId }).select('+email');
        const studentEmails = students.map(s => s.email).filter(email => email);

        if (studentEmails.length > 0) {
            await User.deleteMany({ email: { $in: studentEmails } });
        }
        await Student.deleteMany({ group: groupId });
        await Load.deleteMany({ group: groupId });
        await Schedule.deleteMany({ group: groupId });
        await Group.findByIdAndDelete(groupId);

        res.status(200).json({
            message: `Групу "${group.name}" та всі пов'язані дані (студенти, навантаження, розклад) успішно видалено`
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createGroup,
    getGroups,
    updateGroup,
    deleteGroup,
};
