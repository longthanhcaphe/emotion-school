// backend/controllers/reportController.js
const { generateClassReport } = require('../services/reportService');
const Class = require('../models/Class');

/**
 * @desc    Xuất báo cáo PDF
 * @route   GET /api/reports/export/:classId
 * @access  Private (Teacher, Admin)
 */
const exportClassReport = async (req, res) => {
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
        message: 'Bạn không có quyền xuất báo cáo lớp này'
      });
    }

    console.log(`📄 Generating PDF report for class ${classDoc.code}...`);

    // Generate PDF
    const { buffer, filename } = await generateClassReport(
      classId, 
      parseInt(days),
      req.user._id
    );

    console.log(`✅ PDF generated: ${filename}`);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send PDF
    res.send(buffer);

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất báo cáo',
      error: error.message
    });
  }
};

/**
 * @desc    Preview báo cáo (JSON)
 * @route   GET /api/reports/preview/:classId
 * @access  Private (Teacher, Admin)
 */
const previewReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { days = 7 } = req.query;

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    if (req.user.role === 'teacher' && 
        classDoc.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem báo cáo lớp này'
      });
    }

    const result = await generateClassReport(
      classId, 
      parseInt(days),
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: result.reportData
    });

  } catch (error) {
    console.error('Preview report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xem báo cáo'
    });
  }
};

module.exports = {
  exportClassReport,
  previewReport
};