const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    hoursAssigned: {
        type: Number,
        required: true,
        min: 1,
    },
    type: {
        type: String,
        enum: ['Лекція', 'Практика', 'Лабораторна'],
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

const Load = mongoose.models.Load || mongoose.model('Load', loadSchema);

module.exports = Load;
