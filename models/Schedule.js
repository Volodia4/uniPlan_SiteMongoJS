const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    load: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Load',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    dayOfWeek: {
        type: String,
        enum: ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'],
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    auditorium: {
        type: String,
        required: true,
    },
    semester: {
        type: Number,
        enum: [1, 2],
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const Schedule = mongoose.models.Shedule || mongoose.model('Schedule', ScheduleSchema);

module.exports = Schedule;
