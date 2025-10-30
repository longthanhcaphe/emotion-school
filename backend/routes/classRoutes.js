// backend/routes/classRoutes.js
const express = require('express');
const router = express.Router();
const {
  createClass,
  getClasses,
  getMyClass,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), createClass);
router.get('/', protect, authorize('teacher', 'admin'), getClasses);
router.get('/my-class', protect, authorize('teacher'), getMyClass);
router.get('/:id', protect, authorize('teacher', 'admin'), getClassById);
router.put('/:id', protect, authorize('admin'), updateClass);
router.delete('/:id', protect, authorize('admin'), deleteClass);
router.get('/:id/students', protect, authorize('teacher', 'admin'), getClassStudents);

module.exports = router;