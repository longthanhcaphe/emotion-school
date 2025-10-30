// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');

dotenv.config();
connectDB();

const app = express();
// ⚠️ QUAN TRỌNG: Cập nhật CORS cho production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://emotion-school.vercel.app',
  process.env.CLIENT_URL, // URL của Vercel
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Import routes
const authRoutes = require('./routes/authRoutes');
const feelingRoutes = require('./routes/feelingRoutes');
const classRoutes = require('./routes/classRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');  // ← Thêm

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/feelings', feelingRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);  // ← Thêm

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎓 Emotion School API is running!',
    version: '1.0.0',
    database: 'Connected',
    endpoints: {
      auth: '/api/auth',
      feelings: '/api/feelings',
      classes: '/api/classes',
      students: '/api/students',
      teachers: '/api/teachers',
      dashboard: '/api/dashboard',
      ai: '/api/ai',  // ← Thêm
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    database: require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  🎓 Emotion School API Server         ║
  ║  ✓ Running on port ${PORT}              ║
  ║  ✓ Environment: ${process.env.NODE_ENV}         ║
  ║  ✓ URL: http://localhost:${PORT}         ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
