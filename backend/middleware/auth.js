// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Xác thực user đã đăng nhập
 * Kiểm tra JWT token trong header hoặc cookie
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Lấy token từ Authorization header hoặc cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Format: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // 2. Kiểm tra token có tồn tại không
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }

    try {
      // 3. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Lấy thông tin user từ DB (không lấy password)
      req.user = await User.findById(decoded.id).select('-password');

      // 5. Kiểm tra user còn tồn tại không
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      // 6. Kiểm tra user còn active không
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị khóa'
        });
      }

      // 7. Cho phép request đi tiếp
      next();

    } catch (error) {
      // Token không hợp lệ hoặc hết hạn
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực'
    });
  }
};

/**
 * Middleware: Phân quyền theo role
 * @param {...String} roles - Các role được phép (VD: 'admin', 'teacher')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra role của user có trong danh sách roles cho phép không
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' không có quyền truy cập`
      });
    }
    next();
  };
};

/**
 * Middleware: Chỉ cho phép user truy cập data của chính mình
 * Hoặc teacher/admin có thể truy cập
 */
const authorizeOwnerOrTeacher = (req, res, next) => {
  const requestedUserId = req.params.id || req.params.studentId;
  const currentUserId = req.user._id.toString();
  const currentUserRole = req.user.role;

  // Admin và teacher có thể truy cập data của mọi người
  if (currentUserRole === 'admin' || currentUserRole === 'teacher') {
    return next();
  }

  // Student chỉ có thể truy cập data của chính mình
  if (currentUserRole === 'student' && currentUserId === requestedUserId) {
    return next();
  }

  // Không có quyền
  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền truy cập dữ liệu này'
  });
};

module.exports = { protect, authorize, authorizeOwnerOrTeacher };