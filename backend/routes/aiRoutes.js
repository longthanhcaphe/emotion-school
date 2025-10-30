// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const {
  analyzeClass,
  analyzeStudentController,
  getAIStatus
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.get('/status', protect, getAIStatus);
router.get('/analyze-class/:classId', protect, authorize('teacher', 'admin'), analyzeClass);
router.get('/analyze-student/:studentId', protect, authorize('teacher', 'admin'), analyzeStudentController);

module.exports = router;