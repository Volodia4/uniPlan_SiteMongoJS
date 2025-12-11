const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Користувача не знайдено' });
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Недійсний токен' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Немає токена, авторизація відсутня' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Недостатньо прав. Доступ лише для адміністраторів' });
    }
};

module.exports = { protect, admin };
