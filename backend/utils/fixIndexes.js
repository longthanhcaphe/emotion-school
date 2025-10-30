// backend/utils/fixIndexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const classesCollection = db.collection('classes');

    // Lấy tất cả indexes
    const indexes = await classesCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop index cũ nếu tồn tại
    try {
      await classesCollection.dropIndex('classCode_1');
      console.log('\n✅ Dropped old index: classCode_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  Index classCode_1 không tồn tại (OK)');
      } else {
        throw error;
      }
    }

    // Verify lại
    const newIndexes = await classesCollection.indexes();
    console.log('\n📋 Updated indexes:');
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixIndexes();