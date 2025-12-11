const Load = require('../models/Load');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Group = require('../models/Group');
const Schedule = require('../models/Schedule');

const createLoad = async (req, res) => {
    try {
        const { subject: subjectId, hoursAssigned, type, semester, academicYear } = req.body;

        const [subject, teacher, group] = await Promise.all([
            Subject.findById(subjectId),
            Teacher.findById(req.body.teacher),
            Group.findById(req.body.group),
        ]);

        if (!subject || !teacher || !group) {
            return res.status(404).json({ message: 'Викладач, Предмет або Група не знайдено' });
        }

        let availableHours;
        if (type === 'Лекція') {
            availableHours = subject.hoursLection;
        } else if (type === 'Практика' || type === 'Лабораторна') {
            availableHours = subject.hoursPractice;
        } else {
            return res.status(400).json({ message: 'Недійсний тип навантаження. Дозволено: Лекція, Практика, Лабораторна' });
        }

        const existingLoadSum = await Load.aggregate([
            {
                $match: {
                    subject: subjectId,
                    type: type,
                    semester: semester,
                    academicYear: academicYear,
                }
            },
            {
                $group: {
                    _id: null,
                    totalAssigned: { $sum: "$hoursAssigned" }
                }
            }
        ]);

        const totalAssignedBefore = existingLoadSum.length > 0 ? existingLoadSum[0].totalAssigned : 0;
        const totalAfterAssignment = totalAssignedBefore + hoursAssigned;

        if (totalAfterAssignment > availableHours) {
            return res.status(400).json({
                message: `Навантаження перевищує ліміт годин для цього типу (${type}). Доступно: ${availableHours} годин, Призначено: ${totalAssignedBefore}, Запитується: ${hoursAssigned}`
            });
        }

        const load = new Load(req.body);
        await load.save();
        res.status(201).json(load);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const getLoads = async (req, res) => {
    try {
        const loads = await Load.find({})
            .populate('teacher', 'fullName position')
            .populate('subject', 'name code hoursTotal')
            .populate('group', 'name course');

        res.status(200).json(loads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLoad = async (req, res) => {
    try {
        const loadId = req.params.id;
        const load = await Load.findById(loadId);

        if (!load) {
            return res.status(404).json({ message: 'Навантаження не знайдено' });
        }
        await Schedule.deleteMany({ load: loadId });
        await Load.findByIdAndDelete(loadId);

        res.status(200).json({ message: 'Навантаження та пов\'язаний розклад успішно видалено' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createLoad,
    getLoads,
    deleteLoad,
};
