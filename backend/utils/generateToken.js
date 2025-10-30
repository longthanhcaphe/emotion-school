// backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token và gửi response
 * @param {Object} user - User document từ MongoDB
 * @param {Number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const generateTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Tạo JWT token
  const token = jwt.sign(
    { 
      id: user._id,           // User ID
      role: user.role         // Role để phân quyền
    },
    process.env.JWT_SECRET,   // Secret key từ .env
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'  // Token hết hạn sau 7 ngày
    }
  );

  // Cấu hình cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000  // 7 ngày
    ),
    httpOnly: true,  // Không cho JavaScript truy cập (bảo mật XSS)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'strict'  // CSRF protection
  };

  // Chuẩn bị user data (không trả về password)
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    classId: user.classId,
    studentCode: user.studentCode,
    avatar: user.avatar,
    isActive: user.isActive
  };

  // Gửi response
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)  // Lưu token vào cookie
    .json({
      success: true,
      message: message,
      token: token,  // Cũng trả token trong body cho mobile app
      user: userData
    });
};

/**
 * Tạo JWT token (không gửi response)
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @returns {String} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = { generateTokenResponse, generateToken };