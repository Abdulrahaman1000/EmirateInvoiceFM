// ============================================
// FILE: src/routes/station.js
// Station configuration routes
// ============================================

const express = require('express');
const router = express.Router();
const { 
  getStation, 
  updateStation 
} = require('../controllers/stationController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/station
 * @desc    Get station details (name, address, bank, logo etc.)
 * @access  Private
 */
router.get('/station', protect, getStation);

/**
 * @route   PUT /api/station
 * @desc    Update station details
 * @access  Private
 */
router.put('/station', protect, updateStation);

module.exports = router;