// backend/controllers/dashboardController.js
const User = require('../models/User');
const Class = require('../models/Class');
const Feeling = require('../models/Feeling');

/**
 * @desc    Dashboard cho Admin
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboard = async (req, res) => {
  try {
    // 1. Tổng số
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalClasses = await Class.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });

    // 2. Cảm xúc hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const feelingsToday = await Feeling.countDocuments({
      date: { $gte: today }
    });

    const engagementRate = totalStudents > 0 
      ? ((feelingsToday / totalStudents) * 100).toFixed(1)
      : 0;

    // 3. Thống kê cảm xúc hôm nay
    const emotionStats = await Feeling.aggregate([
      {
        $match: { date: { $gte: today } }
      },
      {
        $group: {
          _id: '$emotion',
          count: { $sum: 1 }
        }
      }
    ]);

    const emotionCounts = emotionStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // 4. Top 5 lớp có engagement cao nhất hôm nay
    const classEngagement = await Feeling.aggregate([
      {
        $match: { date: { $gte: today } }
      },
      {
        $group: {
          _id: '$classId',
          submittedCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $sort: { submittedCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // 5. Xu hướng 7 ngày gần nhất
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const trendData = await Feeling.aggregate([
      {
        $match: { date: { $gte: last7Days } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTeachers,
          totalClasses,
          totalStudents,
          feelingsToday,
          engagementRate: parseFloat(engagementRate)
        },
        emotionCounts,
        classEngagement,
        trendData
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu dashboard'
    });
  }
};

/**
 * @desc    Dashboard cho Teacher
 * @route   GET /api/dashboard/teacher
 * @access  Private (Teacher)
 */
const getTeacherDashboard = async (req, res) => {
  try {
    // Lấy lớp của teacher
    const myClasses = await Class.find({ 
      teacherId: req.user._id,
      isActive: true
    });

    if (myClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa được phân công lớp nào'
      });
    }

    const classIds = myClasses.map(c => c._id);

    // 1. Tổng số học sinh
    const totalStudents = await User.countDocuments({
      classId: { $in: classIds },
      role: 'student'
    });

    // 2. Cảm xúc hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const feelingsToday = await Feeling.countDocuments({
      classId: { $in: classIds },
      date: { $gte: today }
    });

    const engagementRate = totalStudents > 0 
      ? ((feelingsToday / totalStudents) * 100).toFixed(1)
      : 0;

    // 3. Thống kê cảm xúc
    const emotionStats = await Feeling.aggregate([
      {
        $match: {
          classId: { $in: classIds },
          date: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$emotion',
          count: { $sum: 1 }
        }
      }
    ]);

    const emotionCounts = emotionStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // 4. Học sinh cần chú ý (cảm xúc tiêu cực gần đây)
    const concerningStudents = await Feeling.find({
      classId: { $in: classIds },
      emotion: { $in: ['sad', 'angry', 'tired'] },
      date: { $gte: today }
    })
    .populate('studentId', 'name studentCode avatar')
    .populate('classId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    // 5. Xu hướng 7 ngày
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const trendData = await Feeling.aggregate([
      {
        $match: {
          classId: { $in: classIds },
          date: { $gte: last7Days }
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

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalClasses: myClasses.length,
          totalStudents,
          feelingsToday,
          engagementRate: parseFloat(engagementRate)
        },
        emotionCounts,
        concerningStudents,
        trendData,
        classes: myClasses
      }
    });

  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu dashboard'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getTeacherDashboard
};