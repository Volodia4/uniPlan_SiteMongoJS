require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const groupRoutes = require('./routes/groupRoutes');
const loadRoutes = require('./routes/loadRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/students', studentRoutes);

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Успішно підключено до MongoDB!');
        app.listen(PORT, () => {
            console.log(`🌍 Сервер запущено на http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Помилка підключення до MongoDB:', err.message);
        process.exit(1);
    });

app.use(express.static(path.join(__dirname, 'public')));
