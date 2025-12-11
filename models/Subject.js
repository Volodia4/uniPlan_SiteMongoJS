const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    hoursTotal: {
        type: Number,
        required: true,
        min: 1,
    },
    hoursLection: {
        type: Number,
        default: 0,
    },
    hoursPractice: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

module.exports = Subject;
