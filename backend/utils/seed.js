// backend/utils/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Class = require('../models/Class');
const Feeling = require('../models/Feeling');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Class.deleteMany({});
    await Feeling.deleteMany({});
    console.log('🗑️  Cleared old data');

    // Tạo admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Created admin');

    // Tạo giáo viên
    const teacher = await User.create({
      name: 'Cô Lan',
      email: 'teacher@school.com',
      password: 'teacher123',
      role: 'teacher'
    });
    console.log('✅ Created teacher');

    // Tạo lớp học
    const class5A = await Class.create({
      name: 'Lớp 5A',
      code: '5A2024',
      grade: 5,
      teacherId: teacher._id,
      academicYear: '2024-2025'
    });
    console.log('✅ Created class');

    // Tạo học sinh
    const students = await User.insertMany([
      {
        name: 'Nguyễn Văn An',
        role: 'student',
        classId: class5A._id,
        studentCode: 'HS001'
      },
      {
        name: 'Trần Thị Bình',
        role: 'student',
        classId: class5A._id,
        studentCode: 'HS002'
      },
      {
        name: 'Lê Văn Cường',
        role: 'student',
        classId: class5A._id,
        studentCode: 'HS003'
      }
    ]);
    console.log(`✅ Created ${students.length} students`);

    // Tạo cảm xúc mẫu
    await Feeling.insertMany([
      {
        studentId: students[0]._id,
        classId: class5A._id,
        emotion: 'happy',
        message: 'Hôm nay em rất vui!',
        date: new Date()
      },
      {
        studentId: students[1]._id,
        classId: class5A._id,
        emotion: 'neutral',
        date: new Date()
      },
      {
        studentId: students[2]._id,
        classId: class5A._id,
        emotion: 'tired',
        message: 'Em hơi mệt',
        date: new Date()
      }
    ]);
    console.log('✅ Created sample feelings');

    console.log(`
    ╔════════════════════════════════════════╗
    ║  🎉 Seed Data Successfully!           ║
    ║                                        ║
    ║  Admin:   admin@school.com / admin123 ║
    ║  Teacher: teacher@school.com / teacher123 ║
    ║  Class:   5A2024                      ║
    ║  Students: 3 học sinh                 ║
    ╚════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();