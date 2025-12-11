const express = require('express');
const { createGroup, getGroups, updateGroup, deleteGroup } = require('../controllers/groupController');
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.route('/').get(getGroups).post(protect, admin, createGroup);
router.route('/:id').put(protect, admin, updateGroup).delete(protect, admin, deleteGroup);

module.exports = router;
