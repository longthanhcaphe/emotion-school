// backend/utils/reportTemplate.js
const { emotionLabels, emotionEmojis } = require('./encouragementMessages');

/**
 * Tạo HTML template cho báo cáo PDF
 */
const generateReportHTML = (data) => {
  const {
    classInfo,
    period,
    overview,
    emotionStats,
    students,
    concerningStudents,
    aiAnalysis,
    generatedBy,
    generatedAt
  } = data;

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Emotion chart HTML
  const emotionChartHTML = Object.keys(emotionStats.percentages || {})
    .map(emotion => `
      <div class="emotion-bar">
        <div class="emotion-label">
          <span class="emotion-emoji">${emotionEmojis[emotion]}</span>
          <span>${emotionLabels[emotion]}</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill bar-${emotion}" style="width: ${emotionStats.percentages[emotion]}%">
            ${emotionStats.percentages[emotion]}%
          </div>
        </div>
      </div>
    `).join('');

  // Students table HTML
  const studentsTableHTML = students.slice(0, 20).map((student, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${student.name}</td>
      <td>${student.studentCode}</td>
      <td class="emotion-cell">
        ${student.lastEmotion 
          ? `<span class="emotion-badge emotion-${student.lastEmotion}">
               ${emotionEmojis[student.lastEmotion]} ${emotionLabels[student.lastEmotion]}
             </span>`
          : '<span class="text-gray">Chưa gửi</span>'
        }
      </td>
      <td>${student.lastEmotionDate ? formatDate(student.lastEmotionDate) : '-'}</td>
    </tr>
  `).join('');

  // Concerning students HTML
  const concerningHTML = concerningStudents.length > 0 
    ? concerningStudents.map(cs => `
        <div class="alert alert-${cs.riskLevel}">
          <div class="alert-header">
            <span class="alert-icon">⚠️</span>
            <strong>${cs.student.name}</strong> (${cs.student.studentCode})
          </div>
          <div class="alert-body">
            <p>Mức độ: <strong>${cs.riskLevel === 'high' ? 'Cao' : 'Trung bình'}</strong></p>
            <p>${cs.negativeCount} lần cảm xúc tiêu cực trong ${period.days} ngày</p>
            <p>${cs.consecutiveNegative} lần liên tiếp</p>
          </div>
        </div>
      `).join('')
    : '<p class="text-success">✓ Không có học sinh nào cần quan tâm đặc biệt</p>';

  // AI Analysis HTML
  const aiAnalysisHTML = aiAnalysis ? `
    <div class="ai-section">
      <h3>📊 Phân Tích AI</h3>
      
      <div class="ai-summary">
        <h4>Tóm Tắt</h4>
        <p>${aiAnalysis.summary}</p>
      </div>

      <div class="ai-findings">
        <h4>Phát Hiện Chính</h4>
        <ul>
          ${aiAnalysis.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
      </div>

      ${aiAnalysis.trends && aiAnalysis.trends.length > 0 ? `
        <div class="ai-trends">
          <h4>Xu Hướng</h4>
          <ul>
            ${aiAnalysis.trends.map(trend => `<li>${trend}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="ai-suggestions">
        <h4>Gợi Ý Hành Động</h4>
        ${aiAnalysis.actionSuggestions.map(suggestion => `
          <div class="suggestion suggestion-${suggestion.priority}">
            <div class="suggestion-priority">
              ${suggestion.priority === 'high' ? '🔴 Ưu tiên cao' : 
                suggestion.priority === 'medium' ? '🟡 Ưu tiên trung bình' : 
                '🟢 Ưu tiên thấp'}
            </div>
            <div class="suggestion-action">${suggestion.action}</div>
            <div class="suggestion-reason">${suggestion.reason}</div>
          </div>
        `).join('')}
      </div>

      ${aiAnalysis.positiveNotes ? `
        <div class="ai-positive">
          <h4>Điểm Tích Cực</h4>
          <p>${aiAnalysis.positiveNotes}</p>
        </div>
      ` : ''}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Cảm Xúc - ${classInfo.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 30px;
      background: #fff;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #1e40af;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .header h2 {
      color: #3b82f6;
      font-size: 24px;
      margin-bottom: 5px;
    }

    .header .period {
      color: #6b7280;
      font-size: 14px;
    }

    .overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 30px 0;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .stat-card.green {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .stat-card.blue {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .stat-card.orange {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }

    .section h3 {
      color: #1e40af;
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }

    .emotion-bar {
      display: flex;
      align-items: center;
      margin: 10px 0;
    }

    .emotion-label {
      width: 150px;
      font-weight: 600;
    }

    .emotion-emoji {
      font-size: 20px;
      margin-right: 8px;
    }

    .bar-container {
      flex: 1;
      background: #f3f4f6;
      border-radius: 10px;
      height: 30px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      color: white;
      font-weight: bold;
      font-size: 12px;
      transition: width 0.3s ease;
    }

    .bar-happy { background: linear-gradient(90deg, #10b981, #059669); }
    .bar-neutral { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .bar-sad { background: linear-gradient(90deg, #3b82f6, #2563eb); }
    .bar-angry { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .bar-tired { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background: #f3f4f6;
      color: #1f2937;
      font-weight: 600;
    }

    tr:hover {
      background: #f9fafb;
    }

    .emotion-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .emotion-badge.emotion-happy { background: #d1fae5; color: #065f46; }
    .emotion-badge.emotion-neutral { background: #fef3c7; color: #92400e; }
    .emotion-badge.emotion-sad { background: #dbeafe; color: #1e40af; }
    .emotion-badge.emotion-angry { background: #fee2e2; color: #991b1b; }
    .emotion-badge.emotion-tired { background: #ede9fe; color: #5b21b6; }

    .alert {
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 4px solid;
    }

    .alert-high {
      background: #fee2e2;
      border-color: #dc2626;
    }

    .alert-medium {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .alert-header {
      font-weight: 600;
      margin-bottom: 5px;
    }

    .alert-icon {
      font-size: 18px;
      margin-right: 5px;
    }

    .alert-body p {
      margin: 3px 0;
      font-size: 14px;
    }

    .ai-section {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }

    .ai-section h3 {
      color: #0369a1;
    }

    .ai-section h4 {
      color: #0c4a6e;
      font-size: 16px;
      margin: 15px 0 10px 0;
    }

    .ai-summary, .ai-findings, .ai-trends, .ai-positive {
      margin: 15px 0;
    }

    .ai-section ul {
      list-style: none;
      padding-left: 0;
    }

    .ai-section li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }

    .ai-section li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-weight: bold;
    }

    .suggestion {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 4px solid;
    }

    .suggestion-high { border-color: #dc2626; }
    .suggestion-medium { border-color: #f59e0b; }
    .suggestion-low { border-color: #10b981; }

    .suggestion-priority {
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 5px;
    }

    .suggestion-action {
      font-weight: 600;
      color: #1f2937;
      margin: 5px 0;
    }

    .suggestion-reason {
      font-size: 14px;
      color: #6b7280;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    .text-gray { color: #9ca3af; }
    .text-success { color: #10b981; font-weight: 600; }

    @media print {
      body { padding: 15px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Báo Cáo Cảm Xúc Học Đường</h1>
    <h2>${classInfo.name} - ${classInfo.code}</h2>
    <p class="period">
      Từ ${formatDate(period.startDate)} đến ${formatDate(period.endDate)}
    </p>
  </div>

  <div class="overview">
    <div class="stat-card blue">
      <div class="stat-label">Tổng Học Sinh</div>
      <div class="stat-value">${overview.totalStudents}</div>
    </div>
    <div class="stat-card green">
      <div class="stat-label">Đã Gửi Cảm Xúc</div>
      <div class="stat-value">${overview.submitted}</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-label">Tỷ Lệ Tham Gia</div>
      <div class="stat-value">${overview.submissionRate}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Tổng Lượt Gửi</div>
      <div class="stat-value">${emotionStats.total}</div>
    </div>
  </div>

  <div class="section">
    <h3>📈 Phân Bố Cảm Xúc</h3>
    ${emotionChartHTML}
  </div>

  <div class="section">
    <h3>👥 Danh Sách Học Sinh</h3>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Họ Tên</th>
          <th>Mã HS</th>
          <th>Cảm Xúc Gần Nhất</th>
          <th>Ngày</th>
        </tr>
      </thead>
      <tbody>
        ${studentsTableHTML}
      </tbody>
    </table>
    ${students.length > 20 ? `<p style="text-align: center; color: #6b7280;">... và ${students.length - 20} học sinh khác</p>` : ''}
  </div>

  <div class="section">
    <h3>⚠️ Học Sinh Cần Quan Tâm</h3>
    ${concerningHTML}
  </div>

  ${aiAnalysisHTML}

  <div class="footer">
    <p><strong>Người xuất báo cáo:</strong> ${generatedBy.name} (${generatedBy.role === 'teacher' ? 'Giáo viên' : 'Quản trị viên'})</p>
    <p><strong>Thời gian xuất:</strong> ${formatDate(generatedAt)}</p>
    <p style="margin-top: 10px;">
      <em>Báo cáo được tạo tự động bởi Hệ Thống Cảm Xúc Học Đường</em>
    </p>
  </div>
</body>
</html>
  `;
};

module.exports = { generateReportHTML };