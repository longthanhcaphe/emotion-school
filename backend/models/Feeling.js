// backend/models/Feeling.js
const mongoose = require('mongoose');

const feelingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Thiếu thông tin học sinh']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Thiếu thông tin lớp học']
  },
  emotion: {
    type: String,
    required: [true, 'Vui lòng chọn cảm xúc'],
    enum: {
      values: ['happy', 'neutral', 'sad', 'angry', 'tired'],
      message: 'Cảm xúc không hợp lệ'
    }
  },
  message: {
    type: String,
    maxlength: [500, 'Tin nhắn không quá 500 ký tự'],
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để query nhanh
feelingSchema.index({ studentId: 1, date: -1 }); // Cảm xúc của 1 học sinh theo ngày
feelingSchema.index({ classId: 1, date: -1 });   // Cảm xúc của cả lớp theo ngày
feelingSchema.index({ date: -1 });                // Sắp xếp theo ngày
feelingSchema.index({ emotion: 1 });              // Thống kê theo cảm xúc

// Static method: Lấy cảm xúc hôm nay của học sinh
feelingSchema.statics.getTodayFeeling = async function(studentId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await this.findOne({
    studentId: studentId,
    date: { $gte: today }
  }).sort({ createdAt: -1 });
};

// Static method: Thống kê cảm xúc theo ngày
feelingSchema.statics.getStatsByDate = async function(classId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        classId: mongoose.Types.ObjectId(classId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
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
};

// Method: Kiểm tra học sinh đã gửi cảm xúc hôm nay chưa
feelingSchema.statics.hasSubmittedToday = async function(studentId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const feeling = await this.findOne({
    studentId: studentId,
    date: { $gte: today }
  });
  
  return !!feeling;
};

module.exports = mongoose.model('Feeling', feelingSchema);