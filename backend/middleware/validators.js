// backend/middleware/validators.js
const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware để handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Validation rules cho registration
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tên không được để trống')
    .isLength({ min: 2, max: 50 }).withMessage('Tên phải từ 2-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/).withMessage('Tên chỉ được chứa chữ cái'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mật khẩu phải có chữ hoa, chữ thường và số'),
  
  body('role')
    .optional()
    .isIn(['admin', 'teacher']).withMessage('Role không hợp lệ'),

  handleValidationErrors
];

/**
 * Validation rules cho login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),

  handleValidationErrors
];

/**
 * Validation rules cho student login
 */
const validateStudentLogin = [
  body('studentCode')
    .trim()
    .notEmpty().withMessage('Mã học sinh không được để trống')
    .matches(/^[A-Z0-9]+$/).withMessage('Mã học sinh chỉ được chứa chữ in hoa và số'),
  
  body('classId')
    .notEmpty().withMessage('Class ID không được để trống')
    .isMongoId().withMessage('Class ID không hợp lệ'),

  handleValidationErrors
];

/**
 * Validation rules cho tạo class
 */
const validateCreateClass = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tên lớp không được để trống')
    .isLength({ min: 2, max: 50 }).withMessage('Tên lớp phải từ 2-50 ký tự'),
  
  body('code')
    .trim()
    .notEmpty().withMessage('Mã lớp không được để trống')
    .matches(/^[A-Z0-9]+$/).withMessage('Mã lớp chỉ được chứa chữ in hoa và số')
    .isLength({ min: 2, max: 20 }).withMessage('Mã lớp phải từ 2-20 ký tự'),
  
  body('grade')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Khối phải từ 1-12'),
  
  body('schoolYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/).withMessage('Năm học phải có format YYYY-YYYY (vd: 2024-2025)'),

  handleValidationErrors
];

/**
 * Validation rules cho tạo student
 */
const validateCreateStudent = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tên học sinh không được để trống')
    .isLength({ min: 2, max: 50 }).withMessage('Tên phải từ 2-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/).withMessage('Tên chỉ được chứa chữ cái'),
  
  body('studentCode')
    .trim()
    .notEmpty().withMessage('Mã học sinh không được để trống')
    .matches(/^[A-Z0-9]+$/).withMessage('Mã học sinh chỉ được chứa chữ in hoa và số')
    .isLength({ min: 3, max: 20 }).withMessage('Mã học sinh phải từ 3-20 ký tự'),
  
  body('classId')
    .notEmpty().withMessage('Class ID không được để trống')
    .isMongoId().withMessage('Class ID không hợp lệ'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Ngày sinh không hợp lệ'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ'),

  handleValidationErrors
];

/**
 * Validation rules cho submit feeling
 */
const validateSubmitFeeling = [
  body('emotion')
    .notEmpty().withMessage('Cảm xúc không được để trống')
    .isIn(['happy', 'neutral', 'sad', 'angry', 'tired']).withMessage('Cảm xúc không hợp lệ'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Tin nhắn không được quá 500 ký tự'),
  
  body('classId')
    .notEmpty().withMessage('Class ID không được để trống')
    .isMongoId().withMessage('Class ID không hợp lệ'),

  handleValidationErrors
];

/**
 * Validation cho MongoDB ObjectId params
 */
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`${paramName} không hợp lệ`),
  
  handleValidationErrors
];

/**
 * Validation cho query params phổ biến
 */
const validateCommonQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Days phải từ 1-365'),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateStudentLogin,
  validateCreateClass,
  validateCreateStudent,
  validateSubmitFeeling,
  validateMongoId,
  validateCommonQuery
};