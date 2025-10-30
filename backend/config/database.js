// backend/config/database.js
const mongoose = require('mongoose');

/**
 * Kết nối tới MongoDB
 * Hỗ trợ cả MongoDB Atlas và Local
 */
const connectDB = async () => {
  try {
    // Cấu hình mongoose
    mongoose.set('strictQuery', false); // Tắt strict mode

    // Kết nối
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,      // Parse connection string mới
      useUnifiedTopology: true,   // Dùng engine mới
    });

    console.log(`
    ╔════════════════════════════════════════╗
    ║  ✓ MongoDB Connected Successfully     ║
    ║  📦 Database: ${conn.connection.name.padEnd(22)}║
    ║  🌐 Host: ${conn.connection.host.padEnd(26)}║
    ║  📊 Collections: ${Object.keys(conn.connection.collections).length.toString().padEnd(18)}║
    ╚════════════════════════════════════════╝
    `);

    // Event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Kiểm tra lại:');
    console.error('   1. Connection string trong .env');
    console.error('   2. IP đã whitelist trên Atlas');
    console.error('   3. Username/password đúng');
    process.exit(1); // Thoát nếu không kết nối được
  }
};

module.exports = connectDB;