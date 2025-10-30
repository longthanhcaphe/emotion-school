// backend/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  transferStudent,
  bulkImportStudents
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher', 'admin'), createStudent);
router.get('/', protect, authorize('teacher', 'admin'), getStudents);
router.post('/bulk-import', protect, authorize('teacher', 'admin'), bulkImportStudents);
router.get('/:id', protect, authorize('teacher', 'admin'), getStudentById);
router.put('/:id', protect, authorize('teacher', 'admin'), updateStudent);
router.delete('/:id', protect, authorize('admin'), deleteStudent);
router.put('/:id/transfer', protect, authorize('admin'), transferStudent);

module.exports = router;