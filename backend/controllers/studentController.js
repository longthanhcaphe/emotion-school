// backend/controllers/studentController.js
const User = require('../models/User');
const Class = require('../models/Class');
const Feeling = require('../models/Feeling');

/**
 * @desc    Thêm học sinh vào lớp
 * @route   POST /api/students
 * @access  Private (Teacher, Admin)
 */
const createStudent = async (req, res) => {
  try {
    const { name, studentCode, classId, avatar } = req.body;

    // 1. Validation
    if (!name || !studentCode || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // 2. Kiểm tra lớp có tồn tại không
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // 3. Kiểm tra quyền: Teacher chỉ thêm vào lớp của mình
    if (req.user.role === 'teacher' && 
        classDoc.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể thêm học sinh vào lớp của mình'
      });
    }

    // 4. Kiểm tra mã học sinh đã tồn tại trong lớp chưa
    const existingStudent = await User.findOne({
      classId,
      studentCode,
      role: 'student'
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Mã học sinh ${studentCode} đã tồn tại trong lớp`
      });
    }

    // 5. Tạo học sinh mới
    const student = await User.create({
      name,
      studentCode,
      classId,
      role: 'student',
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    const populatedStudent = await User.findById(student._id)
      .populate('classId', 'name code');

    res.status(201).json({
      success: true,
      message: 'Thêm học sinh thành công',
      data: populatedStudent
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm học sinh',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách học sinh
 * @route   GET /api/students
 * @access  Private (Teacher, Admin)
 */
const getStudents = async (req, res) => {
  try {
    const { classId, search } = req.query;

    const query = { role: 'student' };

    // Teacher chỉ xem học sinh trong lớp của mình
    if (req.user.role === 'teacher') {
      const myClasses = await Class.find({ teacherId: req.user._id });
      const classIds = myClasses.map(c => c._id);
      query.classId = { $in: classIds };
    }

    // Filter theo classId
    if (classId) {
      query.classId = classId;
    }

    // Search theo tên hoặc mã học sinh
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentCode: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .populate('classId', 'name code')
      .select('name studentCode avatar isActive createdAt')
      .sort({ 'classId': 1, studentCode: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách học sinh'
    });
  }
};

/**
 * @desc    Lấy chi tiết học sinh
 * @route   GET /api/students/:id
 * @access  Private (Teacher, Admin)
 */
const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .populate('classId', 'name code grade teacherId');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh'
      });
    }

    // Kiểm tra quyền
    if (req.user.role === 'teacher' && 
        student.classId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem học sinh này'
      });
    }

    // Lấy thống kê cảm xúc
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const feelings = await Feeling.find({
      studentId: student._id,
      date: { $gte: last7Days }
    }).sort({ date: -1 });

    // Đếm theo emotion
    const emotionCounts = feelings.reduce((acc, feeling) => {
      acc[feeling.emotion] = (acc[feeling.emotion] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        stats: {
          totalFeelings: feelings.length,
          emotionCounts,
          recentFeelings: feelings.slice(0, 5)
        }
      }
    });

  } catch (error) {
    console.error('Get student by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin học sinh'
    });
  }
};

/**
 * @desc    Cập nhật thông tin học sinh
 * @route   PUT /api/students/:id
 * @access  Private (Teacher, Admin)
 */
const updateStudent = async (req, res) => {
  try {
    const { name, studentCode, avatar, isActive } = req.body;

    const student = await User.findById(req.params.id)
      .populate('classId');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh'
      });
    }

    // Kiểm tra quyền
    if (req.user.role === 'teacher' && 
        student.classId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa học sinh này'
      });
    }

    // Nếu đổi mã học sinh, check trùng
    if (studentCode && studentCode !== student.studentCode) {
      const existing = await User.findOne({
        classId: student.classId._id,
        studentCode,
        role: 'student',
        _id: { $ne: student._id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Mã học sinh ${studentCode} đã tồn tại trong lớp`
        });
      }
    }

    // Update
    if (name) student.name = name;
    if (studentCode) student.studentCode = studentCode;
    if (avatar) student.avatar = avatar;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    const updatedStudent = await User.findById(student._id)
      .populate('classId', 'name code');

    res.status(200).json({
      success: true,
      message: 'Cập nhật học sinh thành công',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật học sinh'
    });
  }
};

/**
 * @desc    Xóa học sinh
 * @route   DELETE /api/students/:id
 * @access  Private (Admin)
 */
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh'
      });
    }

    // Xóa tất cả feelings của học sinh
    await Feeling.deleteMany({ studentId: student._id });

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa học sinh thành công'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa học sinh'
    });
  }
};

/**
 * @desc    Chuyển học sinh sang lớp khác
 * @route   PUT /api/students/:id/transfer
 * @access  Private (Admin)
 */
const transferStudent = async (req, res) => {
  try {
    const { newClassId } = req.body;

    if (!newClassId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn lớp mới'
      });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh'
      });
    }

    const newClass = await Class.findById(newClassId);
    if (!newClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp mới'
      });
    }

    // Kiểm tra mã học sinh có trùng trong lớp mới không
    const existing = await User.findOne({
      classId: newClassId,
      studentCode: student.studentCode,
      role: 'student'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Mã học sinh đã tồn tại trong lớp mới. Vui lòng đổi mã trước khi chuyển.'
      });
    }

    const oldClassId = student.classId;
    student.classId = newClassId;
    await student.save();

    // Cập nhật classId cho tất cả feelings
    await Feeling.updateMany(
      { studentId: student._id },
      { classId: newClassId }
    );

    const updatedStudent = await User.findById(student._id)
      .populate('classId', 'name code');

    res.status(200).json({
      success: true,
      message: 'Chuyển lớp thành công',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Transfer student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi chuyển lớp'
    });
  }
};

/**
 * @desc    Import nhiều học sinh (bulk)
 * @route   POST /api/students/bulk-import
 * @access  Private (Teacher, Admin)
 */
const bulkImportStudents = async (req, res) => {
  try {
    const { classId, students } = req.body;

    // students: [{ name, studentCode }, ...]

    if (!classId || !students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ'
      });
    }

    const classDoc = await Class.findById(classId);
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
        message: 'Bạn chỉ có thể import vào lớp của mình'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const studentData of students) {
      try {
        const { name, studentCode } = studentData;

        if (!name || !studentCode) {
          results.failed.push({
            data: studentData,
            reason: 'Thiếu thông tin'
          });
          continue;
        }

        // Check duplicate
        const existing = await User.findOne({
          classId,
          studentCode,
          role: 'student'
        });

        if (existing) {
          results.failed.push({
            data: studentData,
            reason: 'Mã học sinh đã tồn tại'
          });
          continue;
        }

        // Create
        const student = await User.create({
          name,
          studentCode,
          classId,
          role: 'student',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        });

        results.success.push(student);

      } catch (error) {
        results.failed.push({
          data: studentData,
          reason: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Import thành công ${results.success.length}/${students.length} học sinh`,
      data: results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi import học sinh'
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  transferStudent,
  bulkImportStudents
};