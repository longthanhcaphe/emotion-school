// backend/services/reportService.js
const puppeteer = require('puppeteer');
const { generateReportHTML } = require('../utils/reportTemplate');
const Feeling = require('../models/Feeling');
const User = require('../models/User');
const Class = require('../models/Class');
const { analyzeClassTrends } = require('./aiService');

/**
 * Tạo báo cáo PDF cho lớp học bằng Puppeteer
 */
const generateClassReport = async (classId, days = 7, userId) => {
  let browser = null;
  
  try {
    console.log('📊 Starting report generation...');

    // 1. Lấy thông tin lớp
    const classDoc = await Class.findById(classId)
      .populate('teacherId', 'name email');

    if (!classDoc) {
      throw new Error('Không tìm thấy lớp học');
    }

    console.log(`✓ Class found: ${classDoc.name}`);

    // 2. Lấy danh sách học sinh
    const students = await User.find({
      classId: classId,
      role: 'student',
      isActive: true
    }).select('name studentCode avatar');

    console.log(`✓ Found ${students.length} students`);

    // 3. Lấy feelings trong khoảng thời gian
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const feelings = await Feeling.find({
      classId: classId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('studentId', 'name studentCode');

    console.log(`✓ Found ${feelings.length} feelings`);

    // 4. Tính toán stats
    const emotionStats = {
      total: feelings.length,
      counts: {},
      percentages: {}
    };

    feelings.forEach(f => {
      emotionStats.counts[f.emotion] = (emotionStats.counts[f.emotion] || 0) + 1;
    });

    Object.keys(emotionStats.counts).forEach(emotion => {
      emotionStats.percentages[emotion] = 
        ((emotionStats.counts[emotion] / emotionStats.total) * 100).toFixed(1);
    });

    // 5. Map students với last emotion
    const studentsWithEmotions = await Promise.all(
      students.map(async (student) => {
        const lastFeeling = await Feeling.findOne({
          studentId: student._id
        }).sort({ date: -1 });

        return {
          _id: student._id,
          name: student.name,
          studentCode: student.studentCode,
          lastEmotion: lastFeeling?.emotion || null,
          lastEmotionDate: lastFeeling?.date || null
        };
      })
    );

    // 6. Lấy AI analysis
    let aiAnalysis = null;
    try {
      console.log('🤖 Running AI analysis...');
      const analysis = await analyzeClassTrends(classId, days);
      if (analysis.hasData) {
        aiAnalysis = analysis.analysis;
        console.log('✓ AI analysis completed');
      }
    } catch (error) {
      console.error('⚠️  AI analysis error:', error.message);
    }

    // 7. Concerning students
    const concerningStudents = [];
    for (const student of students) {
      const studentFeelings = feelings.filter(
        f => f.studentId._id.toString() === student._id.toString()
      );

      const negativeCount = studentFeelings.filter(
        f => ['sad', 'angry', 'tired'].includes(f.emotion)
      ).length;

      // Check consecutive
      let maxConsecutive = 0;
      let current = 0;
      studentFeelings.sort((a, b) => a.date - b.date).forEach(f => {
        if (['sad', 'angry', 'tired'].includes(f.emotion)) {
          current++;
          maxConsecutive = Math.max(maxConsecutive, current);
        } else {
          current = 0;
        }
      });

      if (negativeCount >= 3 || maxConsecutive >= 2) {
        concerningStudents.push({
          student,
          negativeCount,
          consecutiveNegative: maxConsecutive,
          riskLevel: maxConsecutive >= 3 || negativeCount >= 5 ? 'high' : 'medium'
        });
      }
    }

    console.log(`✓ Identified ${concerningStudents.length} concerning students`);

    // 8. Lấy thông tin người xuất
    const generatedBy = await User.findById(userId).select('name role');

    // 9. Chuẩn bị data cho template
    const reportData = {
      classInfo: {
        name: classDoc.name,
        code: classDoc.code,
        teacher: classDoc.teacherId.name
      },
      period: {
        days,
        startDate,
        endDate
      },
      overview: {
        totalStudents: students.length,
        submitted: new Set(feelings.map(f => f.studentId._id.toString())).size,
        submissionRate: students.length > 0 
          ? ((new Set(feelings.map(f => f.studentId._id.toString())).size / students.length) * 100).toFixed(1)
          : 0
      },
      emotionStats,
      students: studentsWithEmotions,
      concerningStudents,
      aiAnalysis,
      generatedBy: {
        name: generatedBy.name,
        role: generatedBy.role
      },
      generatedAt: new Date()
    };

    // 10. Generate HTML
    console.log('📝 Generating HTML...');
    const html = generateReportHTML(reportData);

    // 11. Launch Puppeteer và convert to PDF
    console.log('🚀 Launching Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
      timeout: 30000
    });

    console.log('✓ Puppeteer launched');

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    console.log('📄 Setting page content...');
    
    // Set HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('🖨️  Generating PDF...');

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });

    console.log('✅ PDF generated successfully');

    // Close browser
    await browser.close();
    browser = null;

    const filename = `BaoCao_${classDoc.code}_${new Date().toISOString().split('T')[0]}.pdf`;

    return {
      buffer: pdfBuffer,
      filename: filename,
      reportData: reportData
    };

  } catch (error) {
    console.error('❌ Generate report error:', error);
    
    // Đảm bảo browser được close nếu có lỗi
    if (browser) {
      try {
        await browser.close();
        console.log('✓ Browser closed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    throw error;
  }
};

module.exports = {
  generateClassReport
};