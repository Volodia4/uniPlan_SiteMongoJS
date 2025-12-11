const express = require('express');
const { createSubject, getSubjects, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getSubjects).post(protect, admin, createSubject);
router.route('/:id').put(protect, admin, updateSubject).delete(protect, admin, deleteSubject);

module.exports = router;
