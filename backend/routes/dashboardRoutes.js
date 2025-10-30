// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getTeacherDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin'), getAdminDashboard);
router.get('/teacher', protect, authorize('teacher'), getTeacherDashboard);

module.exports = router;