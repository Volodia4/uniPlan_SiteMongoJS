const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    course: {
        type: Number,
        required: true,
        min: 1,
        max: 6,
    },
    studentsCount: {
        type: Number,
        required: true,
        min: 1,
    },
}, { timestamps: true });

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

module.exports = Group;
