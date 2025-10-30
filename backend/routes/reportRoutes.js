// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  exportClassReport,
  previewReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/export/:classId', protect, authorize('teacher', 'admin'), exportClassReport);
router.get('/preview/:classId', protect, authorize('teacher', 'admin'), previewReport);

module.exports = router;