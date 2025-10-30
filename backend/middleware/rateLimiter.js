// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * General rate limiter - áp dụng cho tất cả routes
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều requests. Vui lòng thử lại sau.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Strict rate limiter - cho các routes nhạy cảm (login, register)
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: false, // Count successful requests
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút'
  },
  handler: (req, res) => {
    console.log(`🚨 Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * API rate limiter - cho các API calls thông thường
 * 50 requests per 10 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  message: {
    success: false,
    message: 'Quá nhiều requests đến API. Vui lòng thử lại sau.'
  },
  handler: (req, res) => {
    console.log(`⚠️  API rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều requests. Vui lòng chậm lại.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * PDF Export rate limiter - giới hạn thấp vì tốn tài nguyên
 * 3 requests per 5 minutes per IP
 */
const pdfLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: {
    success: false,
    message: 'Quá nhiều requests xuất PDF. Vui lòng đợi 5 phút.'
  },
  handler: (req, res) => {
    console.log(`🚨 PDF rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Bạn đã xuất quá nhiều báo cáo. Vui lòng đợi 5 phút.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * AI Analysis rate limiter - giới hạn trung bình
 * 10 requests per 10 minutes per IP
 */
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    success: false,
    message: 'Quá nhiều requests phân tích AI. Vui lòng đợi.'
  },
  handler: (req, res) => {
    console.log(`⚠️  AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều requests phân tích. Vui lòng đợi 10 phút.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  pdfLimiter,
  aiLimiter
};