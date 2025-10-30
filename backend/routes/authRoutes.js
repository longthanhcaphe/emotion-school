// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  studentLogin,
  getMe,
  logout,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (không cần đăng nhập)
router.post('/register', register);
router.post('/login', login);
router.post('/student-login', studentLogin);

// Protected routes (cần đăng nhập)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, authorize('teacher', 'admin'), changePassword);

module.exports = router;