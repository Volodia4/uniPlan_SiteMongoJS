const express = require('express');
const { createLoad, getLoads, deleteLoad } = require('../controllers/loadController');
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.route('/').get(getLoads).post(protect, admin, createLoad);
router.route('/:id').delete(protect, admin, deleteLoad);

module.exports = router;
