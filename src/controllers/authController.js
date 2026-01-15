// ============================================
// FILE: src/controllers/authController.js
// Authentication Controller
// ============================================

const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { generateToken } = require('../middleware/auth');

/**
 * @desc    Admin login
 * @route   POST /api/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide username and password'
    });
  }

  // Check for user (include password)
  const user = await User.findOne({ username }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated'
    });
  }

  // Update last login
  await user.updateLastLogin();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    message: 'Login successful'
  });
});

/**
 * @desc    Logout
 * @route   POST /api/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  // Since we're using JWT, logout is handled client-side
  // by removing the token. This endpoint is optional.
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});