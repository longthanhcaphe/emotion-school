// backend/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  toggleTeacherStatus
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), createTeacher);
router.get('/', protect, authorize('admin'), getTeachers);
router.get('/:id', protect, authorize('admin'), getTeacherById);
router.put('/:id', protect, authorize('admin'), updateTeacher);
router.put('/:id/deactivate', protect, authorize('admin'), toggleTeacherStatus);

module.exports = router;