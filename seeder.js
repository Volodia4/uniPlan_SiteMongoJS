require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Group = require('./models/Group');
const Subject = require('./models/Subject');
const Load = require('./models/Load');
const Schedule = require('./models/Schedule');

const MONGO_URI = process.env.MONGO_URI;

const groupsData = [
    { name: 'КН-41', course: 4, studentsCount: 25 },
    { name: 'КН-42', course: 4, studentsCount: 22 },
    { name: 'ПІ-31', course: 3, studentsCount: 28 },
    { name: 'ПІ-32', course: 3, studentsCount: 26 },
    { name: 'КБ-21', course: 2, studentsCount: 30 },
    { name: 'ІПЗ-11', course: 1, studentsCount: 32 },
];

const subjectsData = [
    { name: 'Веб-технології та веб-дизайн', code: 'WEB-101', hoursTotal: 120, hoursLection: 40, hoursPractice: 80 },
    { name: 'Бази даних', code: 'DB-202', hoursTotal: 90, hoursLection: 30, hoursPractice: 60 },
    { name: 'Об\'єктно-орієнтоване програмування', code: 'OOP-303', hoursTotal: 150, hoursLection: 50, hoursPractice: 100 },
    { name: 'Алгоритми та структури даних', code: 'ALG-404', hoursTotal: 120, hoursLection: 60, hoursPractice: 60 },
    { name: 'Комп\'ютерні мережі', code: 'NET-505', hoursTotal: 90, hoursLection: 30, hoursPractice: 60 },
    { name: 'Штучний інтелект', code: 'AI-606', hoursTotal: 120, hoursLection: 40, hoursPractice: 80 },
    { name: 'Кібербезпека', code: 'SEC-707', hoursTotal: 90, hoursLection: 30, hoursPractice: 60 },
    { name: 'Вища математика', code: 'MATH-101', hoursTotal: 180, hoursLection: 90, hoursPractice: 90 },
];

const teachersData = [
    { fullName: 'Петренко Іван Іванович', position: 'Професор', department: 'Кафедра ПЗ', email: 'petrenko@uni.edu', phone: '0501112233' },
    { fullName: 'Коваленко Марія Петрівна', position: 'Доцент', department: 'Кафедра ПЗ', email: 'kovalenko@uni.edu', phone: '0672223344' },
    { fullName: 'Сидоренко Олексій Васильович', position: 'Старший викладач', department: 'Кафедра КС', email: 'sydorenko@uni.edu', phone: '0933334455' },
    { fullName: 'Гончар Олена Сергіївна', position: 'Асистент', department: 'Кафедра ВМ', email: 'honchar@uni.edu', phone: '0504445566' },
    { fullName: 'Мельник Андрій Вікторович', position: 'Доцент', department: 'Кафедра КБ', email: 'melnyk@uni.edu', phone: '0675556677' },
];

const studentsNames = [
    'Бондаренко Владислав', 'Ткаченко Анна', 'Шевченко Дмитро', 'Козак Софія',
    'Романенко Максим', 'Лисенко Вікторія', 'Кравченко Артем', 'Поліщук Анастасія',
    'Захарченко Богдан', 'Олійник Дар\'я', 'Павленко Денис', 'Мельничук Ірина',
    'Клименко Євген', 'Савченко Катерина', 'Кузьменко Олександр', 'Яковенко Юлія',
    'Руденко Павло', 'Мироненко Тетяна', 'Литвиненко Ігор', 'Жук Наталія'
];

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Підключено до MongoDB...');

        console.log('🗑️ Очищення старих даних...');
        await Promise.all([
            User.deleteMany({}),
            Teacher.deleteMany({}),
            Student.deleteMany({}),
            Group.deleteMany({}),
            Subject.deleteMany({}),
            Load.deleteMany({}),
            Schedule.deleteMany({}),
        ]);

        console.log('👑 Створення Адміна...');
        await User.create({
            email: 'admin@gmail.com',
            password: 'admin_4136',
            role: 'admin'
        });

        console.log('📚 Створення Груп та Предметів...');
        const createdGroups = await Group.insertMany(groupsData);
        const createdSubjects = await Subject.insertMany(subjectsData);

        console.log('👨‍🏫 Створення Викладачів...');
        const createdTeachers = [];
        for (const tData of teachersData) {
            const teacher = await Teacher.create(tData);
            await User.create({
                email: tData.email,
                password: 'password123',
                role: 'teacher',
                teacherId: teacher._id
            });
            createdTeachers.push(teacher);
        }

        console.log('🎓 Створення Студентів...');
        const createdStudents = [];
        let studentCounter = 1000;

        for (const name of studentsNames) {
            const randomGroup = createdGroups[Math.floor(Math.random() * createdGroups.length)];
            const email = `student${studentCounter}@uni.edu`;

            const student = await Student.create({
                fullName: name,
                studentID: `KB-${studentCounter}`,
                group: randomGroup._id,
                email: email
            });

            await User.create({
                email: email,
                password: 'password123',
                role: 'student',
                studentId: student._id
            });

            createdStudents.push(student);
            studentCounter++;
        }

        console.log('⚖️ Розподіл Навантаження (з урахуванням лімітів)...');
        const createdLoads = [];
        const academicYear = '2024/2025';

        for (const subject of createdSubjects) {
            let remainingLection = subject.hoursLection;
            let remainingPractice = subject.hoursPractice;

            const targetGroups = createdGroups
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 2) + 2);

            for (const group of targetGroups) {
                const randomTeacher = createdTeachers[Math.floor(Math.random() * createdTeachers.length)];

                if (remainingLection > 0) {
                    let hoursToAssign = Math.floor(remainingLection / targetGroups.length);
                    if (hoursToAssign < 10) hoursToAssign = remainingLection;

                    if (hoursToAssign > 0) {
                        const loadLec = await Load.create({
                            teacher: randomTeacher._id,
                            subject: subject._id,
                            group: group._id,
                            type: 'Лекція',
                            hoursAssigned: hoursToAssign,
                            semester: 1,
                            academicYear
                        });
                        createdLoads.push(loadLec);
                        remainingLection -= hoursToAssign;
                    }
                }

                if (remainingPractice > 0) {
                    let hoursToAssign = Math.floor(remainingPractice / targetGroups.length);
                    if (hoursToAssign < 10) hoursToAssign = remainingPractice;

                    if (hoursToAssign > 0) {
                        const loadPrac = await Load.create({
                            teacher: randomTeacher._id,
                            subject: subject._id,
                            group: group._id,
                            type: 'Практика',
                            hoursAssigned: hoursToAssign,
                            semester: 1,
                            academicYear
                        });
                        createdLoads.push(loadPrac);
                        remainingPractice -= hoursToAssign;
                    }
                }
            }
        }

        console.log('📅 Генерація Розкладу...');
        const days = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця'];
        const times = ['9:00', '10:40', '12:30', '14:10'];
        const auditoriums = ['101', '102', '205', '303', 'Lab-1', 'Online'];

        for (let i = 0; i < createdLoads.length; i++) {
            const load = createdLoads[i];

            let attempts = 0;
            let created = false;

            while (!created && attempts < 10) {
                const day = days[Math.floor(Math.random() * days.length)];
                const time = times[Math.floor(Math.random() * times.length)];
                const aud = auditoriums[Math.floor(Math.random() * auditoriums.length)];

                const conflict = await Schedule.findOne({
                    dayOfWeek: day,
                    startTime: time,
                    $or: [
                        { auditorium: aud },
                        { teacher: load.teacher },
                        { group: load.group }
                    ]
                });

                if (!conflict) {
                    await Schedule.create({
                        load: load._id,
                        teacher: load.teacher,
                        group: load.group,
                        dayOfWeek: day,
                        startTime: time,
                        auditorium: aud,
                        semester: load.semester,
                        academicYear: load.academicYear
                    });
                    created = true;
                }
                attempts++;
            }
        }

        console.log('✅ ДАНІ УСПІШНО ЗАВАНТАЖЕНО!');
        console.log('------------------------------------------------');
        console.log('🔑 ADMIN:   admin@gmail.com  / admin_4136');
        console.log('🔑 TEACHER: petrenko@uni.edu   / password123');
        console.log('🔑 STUDENT: student1000@uni.edu / password123');
        console.log('------------------------------------------------');

        process.exit();
    } catch (error) {
        console.error('❌ Помилка:', error);
        process.exit(1);
    }
};

seedData();
