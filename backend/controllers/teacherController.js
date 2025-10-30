// backend/controllers/teacherController.js
const User = require('../models/User');
const Class = require('../models/Class');

/**
 * @desc    Tạo tài khoản giáo viên
 * @route   POST /api/teachers
 * @access  Private (Admin)
 */
const createTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Check email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create teacher
    const teacher = await User.create({
      name,
      email,
      password,
      role: 'teacher'
    });

    // Remove password from response
    teacher.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản giáo viên thành công',
      data: teacher
    });

  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo giáo viên',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách giáo viên
 * @route   GET /api/teachers
 * @access  Private (Admin)
 */
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ name: 1 });

    // Lấy số lớp của mỗi giáo viên
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const classCount = await Class.countDocuments({ 
          teacherId: teacher._id 
        });

        const studentCount = await User.countDocuments({
          classId: { 
            $in: await Class.find({ teacherId: teacher._id }).distinct('_id') 
          },
          role: 'student'
        });

        return {
          ...teacher.toObject(),
          classCount,
          studentCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachersWithStats
    });

  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giáo viên'
    });
  }
};

/**
 * @desc    Lấy chi tiết giáo viên
 * @route   GET /api/teachers/:id
 * @access  Private (Admin)
 */
const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id).select('-password');

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    // Lấy danh sách lớp
    const classes = await Class.find({ teacherId: teacher._id })
      .select('name code grade academicYear isActive');

    res.status(200).json({
      success: true,
      data: {
        ...teacher.toObject(),
        classes
      }
    });

  } catch (error) {
    console.error('Get teacher by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin giáo viên'
    });
  }
};

/**
 * @desc    Cập nhật giáo viên
 * @route   PUT /api/teachers/:id
 * @access  Private (Admin)
 */
const updateTeacher = async (req, res) => {
  try {
    const { name, email, isActive } = req.body;

    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    // Check email duplicate
    if (email && email !== teacher.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }

    // Update
    if (name) teacher.name = name;
    if (email) teacher.email = email;
    if (isActive !== undefined) teacher.isActive = isActive;

    await teacher.save();

    teacher.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Cập nhật giáo viên thành công',
      data: teacher
    });

  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật giáo viên'
    });
  }
};

/**
 * @desc    Khóa/Mở khóa tài khoản giáo viên
 * @route   PUT /api/teachers/:id/deactivate
 * @access  Private (Admin)
 */
const toggleTeacherStatus = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    res.status(200).json({
      success: true,
      message: teacher.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      data: { isActive: teacher.isActive }
    });

  } catch (error) {
    console.error('Toggle teacher status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái'
    });
  }
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  toggleTeacherStatus
};