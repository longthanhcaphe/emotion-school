// backend/controllers/classController.js
const Class = require('../models/Class');
const User = require('../models/User');
const Feeling = require('../models/Feeling');

/**
 * @desc    Tạo lớp học mới
 * @route   POST /api/classes
 * @access  Private (Admin)
 */
const createClass = async (req, res) => {
  try {
    const { name, code, grade, teacherId, academicYear, description } = req.body;

    // 1. Validation
    if (!name || !code || !grade || !teacherId || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // 2. Kiểm tra mã lớp đã tồn tại chưa
    const existingClass = await Class.findOne({ code: code.toUpperCase() });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: `Mã lớp ${code} đã tồn tại`
      });
    }

    // 3. Kiểm tra teacher có tồn tại không
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Giáo viên không tồn tại hoặc không hợp lệ'
      });
    }

    // 4. Tạo lớp mới
    const classDoc = await Class.create({
      name,
      code: code.toUpperCase(),
      grade,
      teacherId,
      academicYear,
      description
    });

    // 5. Populate teacher info
    const populatedClass = await Class.findById(classDoc._id)
      .populate('teacherId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data: populatedClass
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lớp học',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách lớp học
 * @route   GET /api/classes
 * @access  Private (Teacher, Admin)
 */
const getClasses = async (req, res) => {
  try {
    const { grade, academicYear, isActive } = req.query;

    // Build query
    const query = {};

    // Teacher chỉ xem lớp của mình
    if (req.user.role === 'teacher') {
      query.teacherId = req.user._id;
    }

    if (grade) query.grade = parseInt(grade);
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const classes = await Class.find(query)
      .populate('teacherId', 'name email')
      .populate({
        path: 'students',
        select: 'name studentCode avatar'
      })
      .sort({ grade: 1, name: 1 });

    // Thêm số lượng học sinh cho mỗi lớp
    const classesWithStats = await Promise.all(
      classes.map(async (classDoc) => {
        const studentCount = await User.countDocuments({
          classId: classDoc._id,
          role: 'student'
        });

        return {
          ...classDoc.toObject(),
          studentCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classesWithStats
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lớp'
    });
  }
};

/**
 * @desc    Lấy lớp của teacher hiện tại
 * @route   GET /api/classes/my-class
 * @access  Private (Teacher)
 */
const getMyClass = async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user._id })
      .populate('teacherId', 'name email')
      .sort({ academicYear: -1 });

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa được phân công lớp nào'
      });
    }

    // Lấy lớp active đầu tiên (năm học hiện tại)
    const currentClass = classes.find(c => c.isActive) || classes[0];

    // Đếm số học sinh
    const studentCount = await User.countDocuments({
      classId: currentClass._id,
      role: 'student'
    });

    // Engagement rate hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const submittedToday = await Feeling.countDocuments({
      classId: currentClass._id,
      date: { $gte: today }
    });

    const engagementRate = studentCount > 0 
      ? ((submittedToday / studentCount) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ...currentClass.toObject(),
        studentCount,
        engagementRate: parseFloat(engagementRate),
        submittedToday
      }
    });

  } catch (error) {
    console.error('Get my class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lớp'
    });
  }
};

/**
 * @desc    Lấy chi tiết 1 lớp học
 * @route   GET /api/classes/:id
 * @access  Private (Teacher, Admin)
 */
const getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('teacherId', 'name email');

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Kiểm tra quyền: Teacher chỉ xem lớp của mình
    if (req.user.role === 'teacher' && 
        classDoc.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lớp này'
      });
    }

    // Lấy danh sách học sinh
    const students = await User.find({
      classId: classDoc._id,
      role: 'student'
    }).select('name studentCode avatar isActive createdAt');

    res.status(200).json({
      success: true,
      data: {
        ...classDoc.toObject(),
        students,
        studentCount: students.length
      }
    });

  } catch (error) {
    console.error('Get class by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lớp'
    });
  }
};

/**
 * @desc    Cập nhật thông tin lớp học
 * @route   PUT /api/classes/:id
 * @access  Private (Admin)
 */
const updateClass = async (req, res) => {
  try {
    const { name, grade, teacherId, academicYear, description, isActive } = req.body;

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Nếu đổi teacher, kiểm tra teacher mới có tồn tại không
    if (teacherId && teacherId !== classDoc.teacherId.toString()) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'Giáo viên không hợp lệ'
        });
      }
    }

    // Update fields
    if (name) classDoc.name = name;
    if (grade) classDoc.grade = grade;
    if (teacherId) classDoc.teacherId = teacherId;
    if (academicYear) classDoc.academicYear = academicYear;
    if (description !== undefined) classDoc.description = description;
    if (isActive !== undefined) classDoc.isActive = isActive;

    await classDoc.save();

    const updatedClass = await Class.findById(classDoc._id)
      .populate('teacherId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Cập nhật lớp học thành công',
      data: updatedClass
    });

  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lớp học'
    });
  }
};

/**
 * @desc    Xóa lớp học
 * @route   DELETE /api/classes/:id
 * @access  Private (Admin)
 */
const deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Kiểm tra có học sinh trong lớp không
    const studentCount = await User.countDocuments({
      classId: classDoc._id,
      role: 'student'
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa lớp có ${studentCount} học sinh. Vui lòng chuyển học sinh sang lớp khác trước.`
      });
    }

    // Xóa tất cả feelings liên quan
    await Feeling.deleteMany({ classId: classDoc._id });

    await classDoc.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa lớp học thành công'
    });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lớp học'
    });
  }
};

/**
 * @desc    Lấy danh sách học sinh trong lớp
 * @route   GET /api/classes/:id/students
 * @access  Private (Teacher, Admin)
 */
const getClassStudents = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Kiểm tra quyền
    if (req.user.role === 'teacher' && 
        classDoc.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lớp này'
      });
    }

    const students = await User.find({
      classId: classDoc._id,
      role: 'student'
    }).select('name studentCode avatar isActive createdAt')
      .sort({ studentCode: 1 });

    // Lấy cảm xúc gần nhất của mỗi học sinh
    const studentsWithLastFeeling = await Promise.all(
      students.map(async (student) => {
        const lastFeeling = await Feeling.findOne({
          studentId: student._id
        }).sort({ date: -1 }).limit(1);

        return {
          ...student.toObject(),
          lastFeeling: lastFeeling || null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: students.length,
      data: studentsWithLastFeeling
    });

  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách học sinh'
    });
  }
};

module.exports = {
  createClass,
  getClasses,
  getMyClass,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents
};