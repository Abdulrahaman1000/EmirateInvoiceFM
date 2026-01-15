// ============================================
// FILE: src/routes/rate.js
// Rate card management routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getRates,
  getRateById,
  createRate,
  updateRate,
  deleteRate
} = require('../controllers/rateController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/rates
 * @desc    Get all rates
 * @access  Private
 */
router.get('/rates', protect, getRates);

/**
 * @route   GET /api/rates/:id
 * @desc    Get single rate by ID
 * @access  Private
 */
router.get('/rates/:id', protect, getRateById);

/**
 * @route   POST /api/rates
 * @desc    Add new rate
 * @access  Private
 */
router.post('/rates', protect, createRate);

/**
 * @route   PUT /api/rates/:id
 * @desc    Update rate
 * @access  Private
 */
router.put('/rates/:id', protect, updateRate);

/**
 * @route   DELETE /api/rates/:id
 * @desc    Delete rate
 * @access  Private
 */
router.delete('/rates/:id', protect, deleteRate);

module.exports = router;