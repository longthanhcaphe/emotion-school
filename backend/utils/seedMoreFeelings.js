// backend/utils/seedMoreFeelings.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Feeling = require('../models/Feeling');
const User = require('../models/User');
const Class = require('../models/Class');

dotenv.config();

const seedMoreFeelings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    // Lấy lớp 5A
    const class5A = await Class.findOne({ code: '5A2024' });
    if (!class5A) {
      console.log('❌ Không tìm thấy lớp 5A2024');
      process.exit(1);
    }

    // Lấy học sinh
    const students = await User.find({
      classId: class5A._id,
      role: 'student'
    });

    console.log(`📊 Tìm thấy ${students.length} học sinh`);

    // Tạo feelings cho 7 ngày gần đây
    const feelings = [];
    const emotions = ['happy', 'neutral', 'sad', 'angry', 'tired'];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      // Random 50-80% học sinh gửi cảm xúc mỗi ngày
      const submitRate = 0.5 + Math.random() * 0.3;
      const submitCount = Math.floor(students.length * submitRate);

      const shuffled = [...students].sort(() => Math.random() - 0.5);
      const submitting = shuffled.slice(0, submitCount);

      submitting.forEach(student => {
        // Weighted random emotion
        let emotion;
        const rand = Math.random();
        if (rand < 0.4) emotion = 'happy';
        else if (rand < 0.6) emotion = 'neutral';
        else if (rand < 0.75) emotion = 'tired';
        else if (rand < 0.9) emotion = 'sad';
        else emotion = 'angry';

        feelings.push({
          studentId: student._id,
          classId: class5A._id,
          emotion,
          message: emotion === 'happy' ? 'Hôm nay vui!' : 
                   emotion === 'sad' ? 'Em hơi buồn' : '',
          date
        });
      });
    }

    await Feeling.insertMany(feelings);
    console.log(`✅ Đã tạo ${feelings.length} feelings`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedMoreFeelings();