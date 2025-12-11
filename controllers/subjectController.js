const Subject = require('../models/Subject');
const Load = require('../models/Load');
const Schedule = require('../models/Schedule');

const createSubject = async (req, res) => {
    try {
        const { hoursTotal, hoursLection, hoursPractice } = req.body;
        if (hoursLection + hoursPractice !== hoursTotal) {
            return res.status(400).json({ message: 'Сума лекційних та практичних годин має дорівнювати загальній кількості годин' });
        }

        const subject = new Subject(req.body);
        await subject.save();
        res.status(201).json(subject);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Предмет з такою назвою або кодом вже існує' });
        }
        res.status(400).json({ message: error.message });
    }
};

const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({});
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSubject = async (req, res) => {
    try {
        const { hoursTotal, hoursLection, hoursPractice } = req.body;

        if (hoursTotal !== undefined && hoursLection !== undefined && hoursPractice !== undefined) {
            if (hoursLection + hoursPractice !== hoursTotal) {
                return res.status(400).json({ message: 'Сума лекційних та практичних годин має дорівнювати загальній кількості годин' });
            }
        }

        const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!subject) {
            return res.status(404).json({ message: 'Предмет не знайдено' });
        }
        res.status(200).json(subject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const subjectId = req.params.id;
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({ message: 'Предмет не знайдено' });
        }

        const loads = await Load.find({ subject: subjectId });
        const loadIds = loads.map(l => l._id);

        if (loadIds.length > 0) {
            await Schedule.deleteMany({ load: { $in: loadIds } });
        }
        await Load.deleteMany({ subject: subjectId });
        await Subject.findByIdAndDelete(subjectId);

        res.status(200).json({
            message: `Предмет "${subject.name}" та пов'язане навантаження/розклад видалено`
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSubject,
    getSubjects,
    updateSubject,
    deleteSubject,
};
