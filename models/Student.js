const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    studentID: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        default: null,
        lowercase: true,
    }
}, { timestamps: true });

studentSchema.virtual('viewEmail').get(function() {
    return this.email;
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

module.exports = Student;
