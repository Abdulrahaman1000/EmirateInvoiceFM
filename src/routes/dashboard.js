// ============================================
// FILE: src/routes/dashboard.js
// Dashboard summary routes
// ============================================

const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard summary stats
 * @access  Private
 * @returns {Object} Dashboard summary with totals and recent invoices
 */
router.get('/dashboard', protect, getDashboardSummary);

module.exports = router;