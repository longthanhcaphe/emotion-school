// backend/controllers/feelingController.js
const Feeling = require('../models/Feeling');
const User = require('../models/User');
const Class = require('../models/Class');
const { getEncouragementMessage, emotionLabels } = require('../utils/encouragementMessages');

/**
 * @desc    Học sinh gửi cảm xúc hôm nay
 * @route   POST /api/feelings
 * @access  Private (Student)
 */
const submitFeeling = async (req, res) => {
  try {
    const { emotion, message } = req.body;
    const studentId = req.user._id;
    const classId = req.user.classId;

    // 1. Validation
    if (!emotion) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn cảm xúc'
      });
    }

    const validEmotions = ['happy', 'neutral', 'sad', 'angry', 'tired'];
    if (!validEmotions.includes(emotion)) {
      return res.status(400).json({
        success: false,
        message: 'Cảm xúc không hợp lệ'
      });
    }

    // 2. Kiểm tra đã gửi cảm xúc hôm nay chưa
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingFeeling = await Feeling.findOne({
      studentId: studentId,
      date: { $gte: today }
    });

    if (existingFeeling) {
      return res.status(400).json({
        success: false,
        message: 'Em đã gửi cảm xúc hôm nay rồi! Hãy quay lại vào ngày mai nhé! 🌟',
        alreadySubmitted: true,
        feeling: existingFeeling
      });
    }

    // 3. Tạo feeling mới
    const feeling = await Feeling.create({
      studentId,
      classId,
      emotion,
      message: message || '',
      date: new Date()
    });

    // 4. Populate student và class info
    const populatedFeeling = await Feeling.findById(feeling._id)
      .populate('studentId', 'name avatar studentCode')
      .populate('classId', 'name code');

    // 5. Lấy lời động viên
    const encouragement = getEncouragementMessage(emotion);

    // 6. Log để teacher theo dõi (nếu cảm xúc tiêu cực)
    if (['sad', 'angry', 'tired'].includes(emotion)) {
      console.log(`⚠️ Alert: Student ${req.user.name} (${req.user.studentCode}) has ${emotion} emotion`);
    }

    // 7. Trả về response
    res.status(201).json({
      success: true,
      message: 'Cảm ơn em đã chia sẻ hôm nay! 💛',
      data: populatedFeeling,
      encouragement: {
        message: encouragement.message,
        emoji: encouragement.emoji,
        color: encouragement.color,
        tip: encouragement.tip
      }
    });

  } catch (error) {
    console.error('Submit feeling error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi cảm xúc',
      error: error.message
    });
  }
};

/**
 * @desc    Kiểm tra học sinh đã gửi cảm xúc hôm nay chưa
 * @route   GET /api/feelings/today
 * @access  Private (Student)
 */
const getTodayFeeling = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const feeling = await Feeling.findOne({
      studentId: studentId,
      date: { $gte: today }
    })
    .populate('studentId', 'name avatar')
    .populate('classId', 'name code')
    .sort({ createdAt: -1 });

    if (!feeling) {
      return res.status(200).json({
        success: true,
        submitted: false,
        message: 'Em chưa gửi cảm xúc hôm nay'
      });
    }

    const encouragement = getEncouragementMessage(feeling.emotion);

    res.status(200).json({
      success: true,
      submitted: true,
      data: feeling,
      encouragement
    });

  } catch (error) {
    console.error('Get today feeling error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cảm xúc'
    });
  }
};

/**
 * @desc    Lấy lịch sử cảm xúc của học sinh (7 ngày gần nhất)
 * @route   GET /api/feelings/my-history
 * @access  Private (Student)
 */
const getMyHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { days = 7 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const feelings = await Feeling.find({
      studentId: studentId,
      date: { $gte: daysAgo }
    })
    .populate('classId', 'name code')
    .sort({ date: -1 });

    // Thống kê cảm xúc
    const emotionCounts = feelings.reduce((acc, feeling) => {
      acc[feeling.emotion] = (acc[feeling.emotion] || 0) + 1;
      return acc;
    }, {});

    // Cảm xúc phổ biến nhất
    const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
    );

    res.status(200).json({
      success: true,
      count: feelings.length,
      data: feelings,
      stats: {
        emotionCounts,
        mostCommon: {
          emotion: mostCommonEmotion,
          label: emotionLabels[mostCommonEmotion],
          count: emotionCounts[mostCommonEmotion] || 0
        },
        totalDays: parseInt(days)
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử'
    });
  }
};

/**
 * @desc    Teacher xem tất cả cảm xúc của lớp
 * @route   GET /api/feelings/class/:classId
 * @access  Private (Teacher, Admin)
 */
const getClassFeelings = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, emotion } = req.query;

    // Kiểm tra quyền: Teacher chỉ xem được lớp của mình
    if (req.user.role === 'teacher') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem lớp này'
        });
      }
    }

    // Build query
    const query = { classId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (emotion) {
      query.emotion = emotion;
    }

    const feelings = await Feeling.find(query)
      .populate('studentId', 'name avatar studentCode')
      .populate('classId', 'name code')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: feelings.length,
      data: feelings
    });

  } catch (error) {
    console.error('Get class feelings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu'
    });
  }
};

/**
 * @desc    Teacher xem cảm xúc hôm nay của lớp
 * @route   GET /api/feelings/class/:classId/today
 * @access  Private (Teacher, Admin)
 */
const getClassTodayFeelings = async (req, res) => {
  try {
    const { classId } = req.params;

    // Kiểm tra quyền
    if (req.user.role === 'teacher') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem lớp này'
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lấy tất cả học sinh trong lớp
    const students = await User.find({
      classId: classId,
      role: 'student',
      isActive: true
    }).select('name avatar studentCode');

    // Lấy cảm xúc hôm nay
    const feelings = await Feeling.find({
      classId: classId,
      date: { $gte: today }
    }).populate('studentId', 'name avatar studentCode');

    // Map students với feelings
    const studentsWithFeelings = students.map(student => {
      const feeling = feelings.find(f => 
        f.studentId._id.toString() === student._id.toString()
      );

      return {
        student: {
          _id: student._id,
          name: student.name,
          avatar: student.avatar,
          studentCode: student.studentCode
        },
        feeling: feeling || null,
        submitted: !!feeling
      };
    });

    // Thống kê
    const stats = {
      total: students.length,
      submitted: feelings.length,
      notSubmitted: students.length - feelings.length,
      submissionRate: students.length > 0 
        ? ((feelings.length / students.length) * 100).toFixed(1)
        : 0
    };

    // Đếm theo cảm xúc
    const emotionCounts = feelings.reduce((acc, feeling) => {
      acc[feeling.emotion] = (acc[feeling.emotion] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: studentsWithFeelings,
      stats: {
        ...stats,
        emotionCounts
      }
    });

  } catch (error) {
    console.error('Get class today feelings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu'
    });
  }
};

/**
 * @desc    Thống kê cảm xúc theo ngày/tuần
 * @route   GET /api/feelings/stats/:classId
 * @access  Private (Teacher, Admin)
 */
const getClassStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const { period = 'week' } = req.query; // week, month, custom

    // Kiểm tra quyền
    if (req.user.role === 'teacher') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem lớp này'
        });
      }
    }

    // Tính startDate dựa trên period
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (req.query.startDate) {
      startDate = new Date(req.query.startDate);
    }

    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Aggregate thống kê
    const stats = await Feeling.aggregate([
      {
        $match: {
          classId: require('mongoose').Types.ObjectId(classId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            emotion: '$emotion'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Format data cho chart
    const chartData = {};
    stats.forEach(item => {
      const date = item._id.date;
      if (!chartData[date]) {
        chartData[date] = {
          date,
          happy: 0,
          neutral: 0,
          sad: 0,
          angry: 0,
          tired: 0,
          total: 0
        };
      }
      chartData[date][item._id.emotion] = item.count;
      chartData[date].total += item.count;
    });

    // Tổng hợp
    const totalStats = await Feeling.aggregate([
      {
        $match: {
          classId: require('mongoose').Types.ObjectId(classId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$emotion',
          count: { $sum: 1 }
        }
      }
    ]);

    const emotionSummary = totalStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Tính tỷ lệ %
    const total = totalStats.reduce((sum, item) => sum + item.count, 0);
    const emotionPercentages = {};
    Object.keys(emotionSummary).forEach(emotion => {
      emotionPercentages[emotion] = ((emotionSummary[emotion] / total) * 100).toFixed(1);
    });

    res.status(200).json({
      success: true,
      period: {
        type: period,
        startDate,
        endDate
      },
      chartData: Object.values(chartData),
      summary: {
        total,
        emotionCounts: emotionSummary,
        emotionPercentages
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
};

/**
 * @desc    Xem chi tiết 1 cảm xúc
 * @route   GET /api/feelings/:id
 * @access  Private (Teacher, Admin, hoặc Student của cảm xúc đó)
 */
const getFeelingById = async (req, res) => {
  try {
    const feeling = await Feeling.findById(req.params.id)
      .populate('studentId', 'name avatar studentCode')
      .populate('classId', 'name code');

    if (!feeling) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cảm xúc'
      });
    }

    // Kiểm tra quyền: chỉ student chủ sở hữu hoặc teacher/admin
    if (req.user.role === 'student' && 
        feeling.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem dữ liệu này'
      });
    }

    res.status(200).json({
      success: true,
      data: feeling
    });

  } catch (error) {
    console.error('Get feeling by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu'
    });
  }
};

/**
 * @desc    Xóa cảm xúc (Admin only hoặc student xóa của mình)
 * @route   DELETE /api/feelings/:id
 * @access  Private (Admin hoặc Student owner)
 */
const deleteFeeling = async (req, res) => {
  try {
    const feeling = await Feeling.findById(req.params.id);

    if (!feeling) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cảm xúc'
      });
    }

    // Kiểm tra quyền
    if (req.user.role !== 'admin' && 
        feeling.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa dữ liệu này'
      });
    }

    await feeling.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa cảm xúc'
    });

  } catch (error) {
    console.error('Delete feeling error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa'
    });
  }
};

module.exports = {
  submitFeeling,
  getTodayFeeling,
  getMyHistory,
  getClassFeelings,
  getClassTodayFeelings,
  getClassStats,
  getFeelingById,
  deleteFeeling
};