const express = require('express');
const { createTeacher, getTeachers, getTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getTeachers).post(protect, admin, createTeacher);
router.route('/:id').get(getTeacher).put(protect, admin, updateTeacher).delete(protect, admin, deleteTeacher);

module.exports = router;
