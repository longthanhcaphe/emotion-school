// backend/controllers/authController.js
const User = require('../models/User');
const Class = require('../models/Class');
const { generateTokenResponse } = require('../utils/generateToken');

/**
 * @desc    Đăng ký tài khoản Teacher/Admin
 * @route   POST /api/auth/register
 * @access  Public (hoặc chỉ admin có thể tạo - tùy yêu cầu)
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // 2. Kiểm tra role hợp lệ
    if (role && !['teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    // 3. Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // 4. Tạo user mới
    const user = await User.create({
      name,
      email,
      password,  // Sẽ tự động hash trong model
      role: role || 'teacher'  // Default là teacher
    });

    // 5. Trả về token
    generateTokenResponse(user, 201, res, 'Đăng ký thành công');

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng ký',
      error: error.message
    });
  }
};

/**
 * @desc    Đăng nhập cho Teacher/Admin (email + password)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // 2. Tìm user và lấy cả password (vì select: false trong model)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // 3. Kiểm tra password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // 4. Kiểm tra account active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // 5. Trả về token
    generateTokenResponse(user, 200, res, 'Đăng nhập thành công');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập',
      error: error.message
    });
  }
};

/**
 * @desc    Đăng nhập cho Student (classCode + studentCode, không cần password)
 * @route   POST /api/auth/student-login
 * @access  Public
 */
const studentLogin = async (req, res) => {
  try {
    const { classCode, studentCode, name } = req.body;

    // 1. Validation
    if (!classCode || !studentCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã lớp và mã học sinh'
      });
    }

    // 2. Tìm lớp học
    const classDoc = await Class.findOne({ code: classCode.toUpperCase() });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    if (!classDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Lớp học không còn hoạt động'
      });
    }

    // 3. Tìm học sinh
    let student = await User.findOne({
      role: 'student',
      classId: classDoc._id,
      studentCode: studentCode
    }).populate('classId');

    // 4. Nếu không tìm thấy và có tên → tự động tạo học sinh mới
    if (!student && name) {
      student = await User.create({
        name: name,
        role: 'student',
        classId: classDoc._id,
        studentCode: studentCode,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      });

      student = await User.findById(student._id).populate('classId');
    }

    // 5. Nếu vẫn không có (không nhập tên)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh. Vui lòng nhập tên để tạo tài khoản mới.',
        requireName: true
      });
    }

    // 6. Trả về token
    generateTokenResponse(student, 200, res, 'Đăng nhập thành công');

  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin user hiện tại
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // req.user đã được set trong middleware protect
    const user = await User.findById(req.user._id)
      .populate('classId')
      .select('-password');

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng'
    });
  }
};

/**
 * @desc    Đăng xuất
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Xóa cookie token
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),  // 10 giây
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng xuất'
    });
  }
};

/**
 * @desc    Cập nhật thông tin cá nhân
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (avatar) fieldsToUpdate.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,  // Trả về document mới
        runValidators: true  // Chạy validation
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Cập nhật thành công',
      data: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin'
    });
  }
};

/**
 * @desc    Đổi mật khẩu (chỉ cho teacher/admin)
 * @route   PUT /api/auth/change-password
 * @access  Private (teacher, admin)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Lấy user với password
    const user = await User.findById(req.user._id).select('+password');

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới (sẽ tự động hash trong model)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đổi mật khẩu'
    });
  }
};

module.exports = {
  register,
  login,
  studentLogin,
  getMe,
  logout,
  updateProfile,
  changePassword
};