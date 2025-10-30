// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên'],
    trim: true,
    maxlength: [50, 'Tên không quá 50 ký tự']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Email không hợp lệ'
    ],
    // Email chỉ bắt buộc cho teacher và admin
    required: function() {
      return this.role !== 'student';
    }
  },
  password: {
    type: String,
    minlength: [6, 'Mật khẩu ít nhất 6 ký tự'],
    select: false, // Không trả về password khi query
    // Password chỉ bắt buộc cho teacher và admin
    required: function() {
      return this.role !== 'student';
    }
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    // ClassId bắt buộc cho student
    required: function() {
      return this.role === 'student';
    }
  },
  studentCode: {
    type: String,
    trim: true,
    // Mã học sinh chỉ cho student
    required: function() {
      return this.role === 'student';
    }
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=Student&background=random'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Tự động tạo createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index để tìm kiếm nhanh
userSchema.index({ email: 1 });
userSchema.index({ classId: 1, studentCode: 1 });
userSchema.index({ role: 1 });

// Virtual: Lấy danh sách cảm xúc của học sinh
userSchema.virtual('feelings', {
  ref: 'Feeling',
  localField: '_id',
  foreignField: 'studentId'
});

// Middleware: Hash password trước khi save
userSchema.pre('save', async function(next) {
  // Chỉ hash khi password được modify
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash password với bcrypt
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: So sánh password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Static method: Tìm học sinh theo classCode và studentCode
userSchema.statics.findStudentByCode = async function(classCode, studentCode) {
  const Class = mongoose.model('Class');
  const classDoc = await Class.findOne({ code: classCode });
  
  if (!classDoc) {
    throw new Error('Không tìm thấy lớp học');
  }
  
  const student = await this.findOne({
    role: 'student',
    classId: classDoc._id,
    studentCode: studentCode
  }).populate('classId');
  
  return student;
};

module.exports = mongoose.model('User', userSchema);