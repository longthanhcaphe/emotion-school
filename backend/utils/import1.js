// backend/utils/seedClassData.js (hoặc backend/import1.js)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env từ thư mục backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ⚠️ QUAN TRỌNG: Sửa đường dẫn require
const User = require('../models/User');
const Class = require('../models/Class');
const Feeling = require('../models/Feeling');

const CLASS_ID = '69031e34711c4d3f359abfa9';

// 20 học sinh với tên Việt Nam
const STUDENTS = [
  { name: 'Nguyễn Văn An', studentCode: 'HS001' },
  { name: 'Trần Thị Bình', studentCode: 'HS002' },
  { name: 'Lê Văn Cường', studentCode: 'HS003' },
  { name: 'Phạm Thị Dung', studentCode: 'HS004' },
  { name: 'Hoàng Văn Em', studentCode: 'HS005' },
  { name: 'Vũ Thị Hoa', studentCode: 'HS006' },
  { name: 'Đỗ Văn Khoa', studentCode: 'HS007' },
  { name: 'Bùi Thị Lan', studentCode: 'HS008' },
  { name: 'Phan Văn Minh', studentCode: 'HS009' },
  { name: 'Mai Thị Nga', studentCode: 'HS010' },
  { name: 'Trương Văn Phúc', studentCode: 'HS011' },
  { name: 'Lý Thị Quỳnh', studentCode: 'HS012' },
  { name: 'Đinh Văn Sang', studentCode: 'HS013' },
  { name: 'Võ Thị Thảo', studentCode: 'HS014' },
  { name: 'Hồ Văn Tuấn', studentCode: 'HS015' },
  { name: 'Đặng Thị Uyên', studentCode: 'HS016' },
  { name: 'Tô Văn Vinh', studentCode: 'HS017' },
  { name: 'Chu Thị Xuân', studentCode: 'HS018' },
  { name: 'Dương Văn Yên', studentCode: 'HS019' },
  { name: 'Ngô Thị Ánh', studentCode: 'HS020' },
];

// Messages cho mỗi emotion
const MESSAGES = {
  happy: [
    'Hôm nay em học được bài mới rất thú vị!',
    'Em chơi với bạn rất vui!',
    'Cô khen em hôm nay!',
    'Em làm bài tốt!',
    'Em được điểm cao!',
    'Thầy cho em sticker!',
    'Em hiểu bài ngay!',
    '',
  ],
  neutral: [
    'Bình thường thôi',
    'Cũng được',
    'Không có gì đặc biệt',
    '',
    '',
  ],
  sad: [
    'Em buồn',
    'Bạn không chơi với em',
    'Em nhớ ba mẹ',
    'Bị bạn chọc',
    'Em làm bài sai',
    'Em bị mắng',
    '',
  ],
  angry: [
    'Em tức quá!',
    'Bạn làm em giận',
    'Không công bằng!',
    'Em không thích!',
    '',
  ],
  tired: [
    'Em mệt quá',
    'Bài tập nhiều quá',
    'Em buồn ngủ',
    'Em không muốn học nữa',
    'Em thức khuya',
    '',
  ],
};

const seedClassData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Kiểm tra lớp tồn tại
    console.log(`📚 Checking class ${CLASS_ID}...`);
    const classDoc = await Class.findById(CLASS_ID);
    
    if (!classDoc) {
      console.error(`❌ Class with ID ${CLASS_ID} not found!`);
      console.log('\n💡 To find your class ID, run:');
      console.log('   db.classes.find({}, {name: 1, code: 1})');
      console.log('\n💡 Or run this in MongoDB Compass:');
      console.log('   Classes collection → Find → Copy _id');
      process.exit(1);
    }

    console.log(`✅ Found class: ${classDoc.name} (${classDoc.code})\n`);

    // 2. Xóa học sinh cũ (nếu có)
    console.log('🗑️  Cleaning old data...');
    const oldStudents = await User.find({ 
      classId: CLASS_ID, 
      role: 'student' 
    });
    
    if (oldStudents.length > 0) {
      await Feeling.deleteMany({ 
        studentId: { $in: oldStudents.map(s => s._id) } 
      });
      await User.deleteMany({ 
        classId: CLASS_ID, 
        role: 'student' 
      });
      console.log(`   Deleted ${oldStudents.length} old students and their feelings\n`);
    } else {
      console.log('   No old data to clean\n');
    }

    // 3. Tạo 20 học sinh
    console.log('👥 Creating 20 students...');
    const students = [];
    
    for (const studentData of STUDENTS) {
      const student = await User.create({
        name: studentData.name,
        studentCode: studentData.studentCode,
        classId: CLASS_ID,
        role: 'student',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=random&color=fff`,
        isActive: true,
      });
      students.push(student);
      console.log(`   ✓ ${student.studentCode}: ${student.name}`);
    }

    console.log(`\n✅ Created ${students.length} students\n`);

    // 4. Tạo feelings cho 10 ngày gần đây
    console.log('💭 Creating feelings for past 10 days...');
    
    const feelings = [];
    const emotions = ['happy', 'neutral', 'sad', 'angry', 'tired'];
    
    // Xác định "concerning students" (học sinh có vấn đề)
    const concerningStudentIndices = [2, 7, 15]; // HS003, HS008, HS016
    
    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(8, 0, 0, 0);

      // 70-90% học sinh gửi cảm xúc mỗi ngày
      const submitRate = 0.7 + Math.random() * 0.2;
      const submitCount = Math.floor(students.length * submitRate);

      // Random chọn học sinh
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      const submitting = shuffled.slice(0, submitCount);

      for (const student of submitting) {
        const studentIndex = students.findIndex(s => s._id.equals(student._id));
        let emotion;

        // Concerning students có nhiều cảm xúc tiêu cực
        if (concerningStudentIndices.includes(studentIndex)) {
          const rand = Math.random();
          if (rand < 0.15) emotion = 'happy';
          else if (rand < 0.25) emotion = 'neutral';
          else if (rand < 0.55) emotion = 'sad';
          else if (rand < 0.75) emotion = 'tired';
          else emotion = 'angry';
        } else {
          // Học sinh bình thường
          const rand = Math.random();
          if (rand < 0.55) emotion = 'happy';
          else if (rand < 0.75) emotion = 'neutral';
          else if (rand < 0.87) emotion = 'tired';
          else if (rand < 0.95) emotion = 'sad';
          else emotion = 'angry';
        }

        // Random message
        const messageArray = MESSAGES[emotion];
        const message = messageArray[Math.floor(Math.random() * messageArray.length)];

        feelings.push({
          studentId: student._id,
          classId: mongoose.Types.ObjectId(CLASS_ID),
          emotion,
          message,
          date: new Date(date),
        });
      }

      console.log(`   ✓ Day ${dayOffset + 1}: ${submitting.length} students submitted`);
    }

    // Insert feelings
    if (feelings.length > 0) {
      await Feeling.insertMany(feelings);
      console.log(`\n✅ Created ${feelings.length} feelings\n`);
    }

    // 5. Statistics
    console.log('📊 STATISTICS:');
    console.log('═══════════════════════════════════════');
    
    const stats = await Feeling.aggregate([
      { $match: { classId: mongoose.Types.ObjectId(CLASS_ID) } },
      { $group: { _id: '$emotion', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const emotionEmojis = {
      happy: '😊',
      neutral: '😐',
      sad: '😔',
      angry: '😡',
      tired: '😴'
    };

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(stat => {
      const percentage = ((stat.count / total) * 100).toFixed(1);
      console.log(`   ${emotionEmojis[stat._id]} ${stat._id.padEnd(8)}: ${stat.count.toString().padStart(3)} (${percentage}%)`);
    });

    console.log('═══════════════════════════════════════');
    console.log(`   TOTAL: ${total} feelings`);

    // Concerning students info
    console.log('\n⚠️  CONCERNING STUDENTS (will show in AI analysis):');
    for (const index of concerningStudentIndices) {
      const student = students[index];
      const studentFeelings = await Feeling.countDocuments({
        studentId: student._id,
        emotion: { $in: ['sad', 'angry', 'tired'] }
      });
      console.log(`   • ${student.name} (${student.studentCode}): ${studentFeelings} negative feelings`);
    }

    console.log('\n✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('\n🧪 NOW TEST AI ANALYSIS:');
    console.log('   1. Login teacher: teacher@school.com / teacher123');
    console.log('   2. Go to teacher dashboard');
    console.log('   3. Click "Xem phân tích" button');
    console.log('   4. See AI analysis with insights!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run
seedClassData();