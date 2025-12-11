const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, teacherId = null, studentId = null) => {
    return jwt.sign({ id, role, teacherId, studentId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'Користувач з таким email вже існує' });
    }

    const user = await User.create({
        email,
        password,
        role: role || 'guest',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(400).json({ message: 'Недійсні дані користувача' });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            teacherId: user.teacherId,
            studentId: user.studentId,
            token: generateToken(user._id, user.role, user.teacherId, user.studentId),
        });
    } else {
        res.status(401).json({ message: 'Невірний email або пароль' });
    }
};

module.exports = {
    registerUser,
    authUser,
};
