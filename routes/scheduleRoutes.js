const express = require('express');
const { createScheduleEntry, getSchedule, deleteScheduleEntry } = require('../controllers/scheduleController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getSchedule).post(protect, admin, createScheduleEntry);
router.route('/:id').delete(protect, admin, deleteScheduleEntry);

module.exports = router;
