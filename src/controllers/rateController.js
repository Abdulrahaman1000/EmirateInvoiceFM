// ============================================
// FILE: src/controllers/rateController.js
// Rate Card Management Controller
// ============================================

const Rate = require('../models/Rate');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get all rates
 * @route   GET /api/rates
 * @access  Private
 */
exports.getRates = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let query = { isActive: true };

  // Filter by category
  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }

  const rates = await Rate.find(query).sort({ category: 1, price: 1 });

  res.status(200).json({
    success: true,
    count: rates.length,
    data: rates
  });
});

/**
 * @desc    Get single rate by ID
 * @route   GET /api/rates/:id
 * @access  Private
 */
exports.getRateById = asyncHandler(async (req, res) => {
  const rate = await Rate.findById(req.params.id);

  if (!rate) {
    return res.status(404).json({
      success: false,
      message: 'Rate not found'
    });
  }

  res.status(200).json({
    success: true,
    data: rate
  });
});

/**
 * @desc    Create new rate
 * @route   POST /api/rates
 * @access  Private
 */
exports.createRate = asyncHandler(async (req, res) => {
  const { category, duration, time_slot, platform, price, description } = req.body;

  // Validate required fields
  if (!category || price === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Category and price are required'
    });
  }

  // Create rate
  const rate = await Rate.create({
    category,
    duration,
    time_slot,
    platform,
    price,
    description
  });

  res.status(201).json({
    success: true,
    data: rate,
    message: 'Rate created successfully'
  });
});

/**
 * @desc    Update rate
 * @route   PUT /api/rates/:id
 * @access  Private
 */
exports.updateRate = asyncHandler(async (req, res) => {
  let rate = await Rate.findById(req.params.id);

  if (!rate) {
    return res.status(404).json({
      success: false,
      message: 'Rate not found'
    });
  }

  // Update rate
  rate = await Rate.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: rate,
    message: 'Rate updated successfully'
  });
});

/**
 * @desc    Delete rate
 * @route   DELETE /api/rates/:id
 * @access  Private
 */
exports.deleteRate = asyncHandler(async (req, res) => {
  const rate = await Rate.findById(req.params.id);

  if (!rate) {
    return res.status(404).json({
      success: false,
      message: 'Rate not found'
    });
  }

  await rate.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Rate deleted successfully'
  });
});