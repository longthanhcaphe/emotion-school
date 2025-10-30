// backend/services/aiService.js
const OpenAI = require('openai');
const Feeling = require('../models/Feeling');
const User = require('../models/User');
const { emotionLabels } = require('../utils/encouragementMessages');

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

/**
 * Kiểm tra xem có thể dùng AI không
 */
const isAIAvailable = () => {
  return !!openai && process.env.AI_PROVIDER === 'openai';
};

/**
 * Phân tích xu hướng cảm xúc của lớp
 * @param {String} classId - ID của lớp
 * @param {Number} days - Số ngày phân tích (default: 7)
 * @returns {Object} Analysis results
 */
const analyzeClassTrends = async (classId, days = 7) => {
  try {
    // 1. Lấy dữ liệu cảm xúc
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feelings = await Feeling.find({
      classId,
      date: { $gte: startDate }
    })
    .populate('studentId', 'name studentCode')
    .sort({ date: 1 });

    if (feelings.length === 0) {
      return {
        hasData: false,
        message: 'Chưa có đủ dữ liệu để phân tích'
      };
    }

    // 2. Chuẩn bị dữ liệu cho AI
    const emotionStats = prepareEmotionStats(feelings);
    const dailyBreakdown = prepareDailyBreakdown(feelings);
    const concerningStudents = identifyConcerningStudents(feelings);

    // 3. Gọi AI hoặc dùng rule-based
    let analysis;
    if (isAIAvailable()) {
      analysis = await analyzeWithOpenAI(emotionStats, dailyBreakdown, concerningStudents, days);
    } else {
      analysis = analyzeWithRules(emotionStats, dailyBreakdown, concerningStudents, days);
    }

    return {
      hasData: true,
      period: { days, startDate, endDate: new Date() },
      emotionStats,
      dailyBreakdown,
      concerningStudents,
      analysis,
      aiProvider: isAIAvailable() ? 'openai' : 'rule-based'
    };

  } catch (error) {
    console.error('Analyze class trends error:', error);
    throw error;
  }
};

/**
 * Chuẩn bị thống kê cảm xúc tổng quan
 */
const prepareEmotionStats = (feelings) => {
  const total = feelings.length;
  const counts = feelings.reduce((acc, feeling) => {
    acc[feeling.emotion] = (acc[feeling.emotion] || 0) + 1;
    return acc;
  }, {});

  const percentages = {};
  Object.keys(counts).forEach(emotion => {
    percentages[emotion] = ((counts[emotion] / total) * 100).toFixed(1);
  });

  return {
    total,
    counts,
    percentages,
    mostCommon: Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b),
    negativeCount: (counts.sad || 0) + (counts.angry || 0) + (counts.tired || 0),
    positiveCount: counts.happy || 0,
    neutralCount: counts.neutral || 0
  };
};

/**
 * Chuẩn bị breakdown theo ngày
 */
const prepareDailyBreakdown = (feelings) => {
  const dailyData = {};

  feelings.forEach(feeling => {
    const dateKey = feeling.date.toISOString().split('T')[0];
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        happy: 0,
        neutral: 0,
        sad: 0,
        angry: 0,
        tired: 0,
        total: 0
      };
    }
    dailyData[dateKey][feeling.emotion]++;
    dailyData[dateKey].total++;
  });

  return Object.values(dailyData).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
};

/**
 * Xác định học sinh cần quan tâm
 */
const identifyConcerningStudents = (feelings) => {
  const studentEmotions = {};

  feelings.forEach(feeling => {
    const studentId = feeling.studentId._id.toString();
    if (!studentEmotions[studentId]) {
      studentEmotions[studentId] = {
        student: feeling.studentId,
        emotions: [],
        negativeCount: 0,
        consecutiveNegative: 0
      };
    }

    studentEmotions[studentId].emotions.push(feeling.emotion);

    if (['sad', 'angry', 'tired'].includes(feeling.emotion)) {
      studentEmotions[studentId].negativeCount++;
    }
  });

  // Tính consecutive negative
  Object.values(studentEmotions).forEach(data => {
    let maxConsecutive = 0;
    let current = 0;

    data.emotions.forEach(emotion => {
      if (['sad', 'angry', 'tired'].includes(emotion)) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    });

    data.consecutiveNegative = maxConsecutive;
  });

  // Filter học sinh cần quan tâm
  const concerning = Object.values(studentEmotions)
    .filter(data => 
      data.negativeCount >= 3 || data.consecutiveNegative >= 2
    )
    .map(data => ({
      student: data.student,
      negativeCount: data.negativeCount,
      consecutiveNegative: data.consecutiveNegative,
      totalRecords: data.emotions.length,
      riskLevel: data.consecutiveNegative >= 3 ? 'high' : 
                 data.negativeCount >= 5 ? 'high' : 'medium'
    }))
    .sort((a, b) => b.negativeCount - a.negativeCount);

  return concerning;
};

/**
 * Phân tích bằng OpenAI
 */
const analyzeWithOpenAI = async (emotionStats, dailyBreakdown, concerningStudents, days) => {
  try {
    const prompt = `
Bạn là chuyên gia tâm lý học đường. Phân tích dữ liệu cảm xúc của lớp học tiểu học trong ${days} ngày qua.

DỮ LIỆU:

1. TỔNG QUAN CẢM XÚC:
- Tổng số lượt ghi nhận: ${emotionStats.total}
- Vui vẻ (happy): ${emotionStats.percentages.happy || 0}%
- Bình thường (neutral): ${emotionStats.percentages.neutral || 0}%
- Buồn (sad): ${emotionStats.percentages.sad || 0}%
- Tức giận (angry): ${emotionStats.percentages.angry || 0}%
- Mệt mỏi (tired): ${emotionStats.percentages.tired || 0}%

2. XU HƯỚNG THEO NGÀY:
${dailyBreakdown.map(day => 
  `- ${day.date}: Happy: ${day.happy}, Neutral: ${day.neutral}, Sad: ${day.sad}, Angry: ${day.angry}, Tired: ${day.tired}`
).join('\n')}

3. HỌC SINH CẦN QUAN TÂM: ${concerningStudents.length} em
${concerningStudents.slice(0, 5).map(s => 
  `- ${s.student.name}: ${s.negativeCount} lần cảm xúc tiêu cực, ${s.consecutiveNegative} lần liên tiếp`
).join('\n')}

YÊU CẦU:
Trả về JSON với format sau (KHÔNG thêm markdown, chỉ JSON thuần):
{
  "summary": "Tóm tắt ngắn gọn tình hình cảm xúc lớp (2-3 câu)",
  "keyFindings": [
    "Phát hiện quan trọng 1",
    "Phát hiện quan trọng 2",
    "Phát hiện quan trọng 3"
  ],
  "trends": [
    "Xu hướng đáng chú ý 1",
    "Xu hướng đáng chú ý 2"
  ],
  "actionSuggestions": [
    {
      "priority": "high",
      "action": "Hành động ưu tiên cao",
      "reason": "Lý do"
    },
    {
      "priority": "medium",
      "action": "Hành động ưu tiên trung bình",
      "reason": "Lý do"
    },
    {
      "priority": "low",
      "action": "Hành động ưu tiên thấp",
      "reason": "Lý do"
    }
  ],
  "positiveNotes": "Điểm tích cực của lớp",
  "overallSentiment": "positive/neutral/concerning"
}

Lưu ý: 
- Dùng ngôn ngữ thân thiện, phù hợp giáo viên tiểu học Việt Nam
- Đưa ra gợi ý hành động CỤ THỂ, KHẢ THI
- Tập trung vào GIẢI PHÁP, không chỉ mô tả vấn đề
`;

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Bạn là chuyên gia tâm lý học đường giàu kinh nghiệm, chuyên tư vấn cho giáo viên tiểu học. Luôn trả về JSON hợp lệ.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return {
      ...result,
      generatedAt: new Date(),
      tokensUsed: completion.usage.total_tokens
    };

  } catch (error) {
    console.error('OpenAI analysis error:', error);
    // Fallback to rule-based
    return analyzeWithRules(emotionStats, dailyBreakdown, concerningStudents, days);
  }
};

/**
 * Phân tích bằng rules (fallback)
 */
const analyzeWithRules = (emotionStats, dailyBreakdown, concerningStudents, days) => {
  const negativeRate = ((emotionStats.negativeCount / emotionStats.total) * 100).toFixed(1);
  const positiveRate = ((emotionStats.positiveCount / emotionStats.total) * 100).toFixed(1);

  // Determine overall sentiment
  let overallSentiment = 'neutral';
  if (negativeRate > 40) overallSentiment = 'concerning';
  else if (positiveRate > 50) overallSentiment = 'positive';

  // Generate summary
  let summary = `Trong ${days} ngày qua, lớp có ${emotionStats.total} lượt ghi nhận cảm xúc. `;
  if (overallSentiment === 'positive') {
    summary += `Tâm trạng chung của lớp khá tích cực với ${positiveRate}% cảm xúc vui vẻ.`;
  } else if (overallSentiment === 'concerning') {
    summary += `Cần lưu ý: ${negativeRate}% cảm xúc tiêu cực, cao hơn mức bình thường.`;
  } else {
    summary += `Tâm trạng lớp ở mức ổn định, cần theo dõi thêm.`;
  }

  // Key findings
  const keyFindings = [];
  
  if (emotionStats.percentages.tired > 30) {
    keyFindings.push(`${emotionStats.percentages.tired}% học sinh cảm thấy mệt mỏi - có thể do bài tập nhiều hoặc ngủ không đủ giấc`);
  }
  
  if (emotionStats.percentages.sad > 20) {
    keyFindings.push(`${emotionStats.percentages.sad}% học sinh buồn - cần điều tra nguyên nhân`);
  }

  if (concerningStudents.length > 0) {
    keyFindings.push(`${concerningStudents.length} học sinh có dấu hiệu cần được quan tâm đặc biệt`);
  }

  if (keyFindings.length === 0) {
    keyFindings.push('Không có dấu hiệu đáng lo ngại');
    keyFindings.push('Lớp học có môi trường tâm lý tương đối tốt');
  }

  // Trends
  const trends = [];
  if (dailyBreakdown.length >= 3) {
    const recentDays = dailyBreakdown.slice(-3);
    const olderDays = dailyBreakdown.slice(0, -3);
    
    if (olderDays.length > 0) {
      const recentNegative = recentDays.reduce((sum, day) => sum + day.sad + day.angry + day.tired, 0);
      const olderNegative = olderDays.reduce((sum, day) => sum + day.sad + day.angry + day.tired, 0);
      
      if (recentNegative > olderNegative * 1.3) {
        trends.push('Cảm xúc tiêu cực có xu hướng TĂNG trong 3 ngày gần đây');
      } else if (recentNegative < olderNegative * 0.7) {
        trends.push('Cảm xúc tiêu cực có xu hướng GIẢM - dấu hiệu tích cực');
      }
    }
  }

  // Find most tired day
  const mostTiredDay = dailyBreakdown.reduce((max, day) => 
    day.tired > (max?.tired || 0) ? day : max, null
  );
  
  if (mostTiredDay) {
    const dayName = new Date(mostTiredDay.date).toLocaleDateString('vi-VN', { weekday: 'long' });
    trends.push(`${dayName} (${mostTiredDay.date}) có nhiều học sinh mệt mỏi nhất`);
  }

  // Action suggestions
  const actionSuggestions = [];

  if (concerningStudents.length > 0) {
    actionSuggestions.push({
      priority: 'high',
      action: `Nói chuyện riêng với ${concerningStudents.length} học sinh có nhiều cảm xúc tiêu cực`,
      reason: 'Phát hiện sớm và hỗ trợ kịp thời'
    });
  }

  if (emotionStats.percentages.tired > 30) {
    actionSuggestions.push({
      priority: 'high',
      action: 'Giảm bài tập về nhà trong tuần tới',
      reason: 'Nhiều học sinh cảm thấy mệt mỏi'
    });
  }

  if (emotionStats.percentages.angry > 15) {
    actionSuggestions.push({
      priority: 'medium',
      action: 'Tổ chức hoạt động xây dựng kỹ năng quản lý cảm xúc',
      reason: 'Giúp học sinh kiểm soát cảm xúc tốt hơn'
    });
  }

  actionSuggestions.push({
    priority: 'medium',
    action: 'Tổ chức trò chơi hoặc hoạt động ngoại khóa vui vẻ',
    reason: 'Tạo không khí thoải mái, giảm stress'
  });

  if (positiveRate > 50) {
    actionSuggestions.push({
      priority: 'low',
      action: 'Duy trì phương pháp giảng dạy hiện tại',
      reason: 'Học sinh đang có tâm trạng tích cực'
    });
  }

  // Positive notes
  let positiveNotes = '';
  if (positiveRate > 40) {
    positiveNotes = `Lớp học có môi trường tích cực với ${positiveRate}% cảm xúc vui vẻ. Hãy tiếp tục phát huy!`;
  } else if (concerningStudents.length === 0) {
    positiveNotes = 'Không có học sinh nào cần quan tâm đặc biệt - điều này rất tốt!';
  } else {
    positiveNotes = 'Phần lớn học sinh có tâm trạng ổn định.';
  }

  return {
    summary,
    keyFindings,
    trends: trends.length > 0 ? trends : ['Cần thêm dữ liệu để phát hiện xu hướng rõ ràng'],
    actionSuggestions,
    positiveNotes,
    overallSentiment,
    generatedAt: new Date(),
    method: 'rule-based'
  };
};

/**
 * Phân tích 1 học sinh cụ thể
 */
const analyzeStudent = async (studentId, days = 14) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feelings = await Feeling.find({
      studentId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const student = await User.findById(studentId)
      .populate('classId', 'name code');

    if (feelings.length < 3) {
      return {
        hasData: false,
        message: 'Chưa có đủ dữ liệu để phân tích (cần ít nhất 3 lượt ghi nhận)'
      };
    }

    // Statistics
    const emotionCounts = feelings.reduce((acc, f) => {
      acc[f.emotion] = (acc[f.emotion] || 0) + 1;
      return acc;
    }, {});

    const negativeCount = (emotionCounts.sad || 0) + 
                          (emotionCounts.angry || 0) + 
                          (emotionCounts.tired || 0);

    // Consecutive negative
    let maxConsecutive = 0;
    let current = 0;
    feelings.forEach(f => {
      if (['sad', 'angry', 'tired'].includes(f.emotion)) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    });

    // Risk level
    let riskLevel = 'low';
    if (maxConsecutive >= 3 || negativeCount >= 7) riskLevel = 'high';
    else if (maxConsecutive >= 2 || negativeCount >= 4) riskLevel = 'medium';

    // Recommendations
    const recommendations = [];
    if (riskLevel === 'high') {
      recommendations.push('Nói chuyện riêng với em ngay');
      recommendations.push('Liên hệ phụ huynh để nắm tình hình');
      recommendations.push('Theo dõi sát sao trong thời gian tới');
    } else if (riskLevel === 'medium') {
      recommendations.push('Quan sát thêm vài ngày');
      recommendations.push('Tạo cơ hội để em chia sẻ');
    } else {
      recommendations.push('Tiếp tục theo dõi định kỳ');
    }

    return {
      hasData: true,
      student,
      period: { days, startDate, endDate: new Date() },
      totalRecords: feelings.length,
      emotionCounts,
      negativeCount,
      consecutiveNegative: maxConsecutive,
      riskLevel,
      recommendations,
      recentFeelings: feelings.slice(-5)
    };

  } catch (error) {
    console.error('Analyze student error:', error);
    throw error;
  }
};

module.exports = {
  analyzeClassTrends,
  analyzeStudent,
  isAIAvailable
};