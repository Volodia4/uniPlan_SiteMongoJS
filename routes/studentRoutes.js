const express = require('express');
const { createStudent, getStudents, getStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getStudents).post(protect, admin, createStudent);
router.route('/:id').get(getStudent).put(protect, admin, updateStudent).delete(protect, admin, deleteStudent);

module.exports = router;
