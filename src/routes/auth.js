// ============================================
// FILE: src/routes/auth.js
// Authentication routes
// ============================================

const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/login
 * @desc    Admin login - returns JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/logout
 * @desc    Logout (optional - client can just discard token)
 * @access  Private
 */
router.post('/logout', protect, logout);

module.exports = router;