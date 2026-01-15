// ============================================
// FILE: src/middleware/validation.js
// Request Validation Middleware
// ============================================

/**
 * Validate required fields in request body
 */
exports.validateFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validate MongoDB ObjectId
 */
exports.validateObjectId = (req, res, next) => {
  const mongoose = require('mongoose');
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  next();
};

/**
 * Validate email format
 */
exports.validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
  }

  next();
};

/**
 * Validate phone number format (Nigerian)
 */
exports.validatePhone = (req, res, next) => {
  const { phone } = req.body;

  if (phone) {
    // Nigerian phone format: 080xxxxxxxx or +234xxxxxxxxxx
    const phoneRegex = /^(\+?234|0)[7-9][0-1]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use format: 08012345678 or +2348012345678'
      });
    }
  }

  next();
};

/**
 * Validate numeric fields
 */
exports.validateNumeric = (fields) => {
  return (req, res, next) => {
    const invalidFields = [];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);
        if (isNaN(value) || value < 0) {
          invalidFields.push(field);
        }
      }
    });

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid numeric values for: ${invalidFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validate date format
 */
exports.validateDate = (req, res, next) => {
  const { invoice_date, date_received } = req.body;

  const dateField = invoice_date || date_received;

  if (dateField) {
    const date = new Date(dateField);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
  }

  next();
};

/**
 * Sanitize input - remove dangerous characters
 */
exports.sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS attacks
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }

  next();
};