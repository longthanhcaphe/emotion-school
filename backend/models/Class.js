// backend/models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên lớp'],
    trim: true,
    maxlength: [30, 'Tên lớp không quá 30 ký tự']
  },
  code: {
    type: String,
    required: [true, 'Vui lòng nhập mã lớp'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]+$/, 'Mã lớp chỉ chứa chữ in hoa và số']
  },
  grade: {
    type: Number,
    required: [true, 'Vui lòng nhập khối'],
    min: [1, 'Khối từ 1-12'],
    max: [12, 'Khối từ 1-12']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lớp phải có giáo viên chủ nhiệm']
  },
  academicYear: {
    type: String,
    required: [true, 'Vui lòng nhập năm học'],
    match: [/^\d{4}-\d{4}$/, 'Năm học có dạng YYYY-YYYY (VD: 2024-2025)']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: [200, 'Mô tả không quá 200 ký tự']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index
classSchema.index({ code: 1 });
classSchema.index({ teacherId: 1 });
classSchema.index({ academicYear: 1 });

// Virtual: Danh sách học sinh trong lớp
classSchema.virtual('students', {
  ref: 'User',
  localField: '_id',
  foreignField: 'classId',
  match: { role: 'student' }
});

// Virtual: Tổng số học sinh
classSchema.virtual('studentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'classId',
  count: true
});

// Method: Kiểm tra mã học sinh có tồn tại trong lớp chưa
classSchema.methods.isStudentCodeExist = async function(studentCode) {
  const User = mongoose.model('User');
  const student = await User.findOne({
    classId: this._id,
    studentCode: studentCode,
    role: 'student'
  });
  return !!student;
};

module.exports = mongoose.model('Class', classSchema);