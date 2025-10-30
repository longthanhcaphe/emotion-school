// backend/routes/feelingRoutes.js
const express = require('express');
const router = express.Router();
const {
  submitFeeling,
  getTodayFeeling,
  getMyHistory,
  getClassFeelings,
  getClassTodayFeelings,
  getClassStats,
  getFeelingById,
  deleteFeeling
} = require('../controllers/feelingController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/', protect, authorize('student'), submitFeeling);
router.get('/today', protect, authorize('student'), getTodayFeeling);
router.get('/my-history', protect, authorize('student'), getMyHistory);

// Teacher routes
router.get('/class/:classId', protect, authorize('teacher', 'admin'), getClassFeelings);
router.get('/class/:classId/today', protect, authorize('teacher', 'admin'), getClassTodayFeelings);
router.get('/stats/:classId', protect, authorize('teacher', 'admin'), getClassStats);

// Shared routes
router.get('/:id', protect, getFeelingById);
router.delete('/:id', protect, deleteFeeling);

module.exports = router;