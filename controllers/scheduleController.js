const Schedule = require('../models/Schedule');
const Load = require('../models/Load');

const checkConflict = async ({ teacher, group, auditorium, dayOfWeek, startTime, semester, academicYear, excludeId = null }) => {

    const conflictConditions = {
        dayOfWeek,
        startTime,
        semester,
        academicYear,
        $or: [
            { teacher: teacher },
            { group: group },
            { auditorium: auditorium }
        ]
    };

    if (excludeId) {
        conflictConditions._id = { $ne: excludeId };
    }

    const conflict = await Schedule.findOne(conflictConditions);

    if (conflict) {
        if (String(conflict.teacher) === String(teacher)) return 'Викладач зайнятий у цей час';
        if (String(conflict.group) === String(group)) return 'Група зайнята у цей час';
        if (conflict.auditorium === auditorium) return 'Аудиторія зайнята у цей час';
    }
    return null;
};

const createScheduleEntry = async (req, res) => {
    const { load: loadId, dayOfWeek, startTime, auditorium } = req.body;

    try {
        const loadEntry = await Load.findById(loadId);
        if (!loadEntry) {
            return res.status(404).json({ message: 'Навантаження не знайдено' });
        }

        const { teacher, group, semester, academicYear } = loadEntry;

        const conflictMessage = await checkConflict({
            teacher,
            group,
            auditorium,
            dayOfWeek,
            startTime,
            semester,
            academicYear
        });

        if (conflictMessage) {
            return res.status(400).json({ message: `Конфлікт розкладу: ${conflictMessage}.` });
        }

        const schedule = new Schedule({
            load: loadId,
            teacher,
            group,
            dayOfWeek,
            startTime,
            auditorium,
            semester,
            academicYear
        });

        await schedule.save();
        res.status(201).json(schedule);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.find({})
            .populate({
                path: 'load',
                select: 'subject type hoursAssigned',
                populate: {
                    path: 'subject',
                    select: 'name code'
                }
            })
            .populate('teacher', 'fullName')
            .populate('group', 'name course')
            .select('-load');

        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteScheduleEntry = async (req, res) => {
    try {
        const entry = await Schedule.findByIdAndDelete(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Запис розкладу не знайдено' });
        }
        res.status(200).json({ message: 'Запис розкладу успішно видалено' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createScheduleEntry,
    getSchedule,
    deleteScheduleEntry,
};
