// backend/controllers/aiController.js
const { analyzeClassTrends, analyzeStudent, isAIAvailable } = require('../services/aiService');
const Class = require('../models/Class');

/**
 * @desc    Phân tích xu hướng cảm xúc lớp
 * @route   GET /api/ai/analyze-class/:classId
 * @access  Private (Teacher, Admin)
 */
const analyzeClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { days = 7 } = req.query;

    // Kiểm tra lớp tồn tại
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
        message: 'Bạn không có quyền xem lớp này'
      });
    }

    // Phân tích
    const analysis = await analyzeClassTrends(classId, parseInt(days));

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Analyze class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích',
      error: error.message
    });
  }
};

/**
 * @desc    Phân tích 1 học sinh
 * @route   GET /api/ai/analyze-student/:studentId
 * @access  Private (Teacher, Admin)
 */
const analyzeStudentController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { days = 14 } = req.query;

    const analysis = await analyzeStudent(studentId, parseInt(days));

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Analyze student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích học sinh'
    });
  }
};

/**
 * @desc    Kiểm tra trạng thái AI
 * @route   GET /api/ai/status
 * @access  Private
 */
const getAIStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        available: isAIAvailable(),
        provider: process.env.AI_PROVIDER || 'rule-based',
        model: process.env.AI_MODEL || 'N/A'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra AI status'
    });
  }
};

module.exports = {
  analyzeClass,
  analyzeStudentController,
  getAIStatus
};