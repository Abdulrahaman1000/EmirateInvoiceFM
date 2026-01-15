// ============================================
// FILE: src/controllers/stationController.js
// Station Configuration Controller
// ============================================

const Station = require('../models/Station');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get station details
 * @route   GET /api/station
 * @access  Private
 */
exports.getStation = asyncHandler(async (req, res) => {
  // Get singleton station instance
  const station = await Station.getSingletonInstance();

  res.status(200).json({
    success: true,
    data: station
  });
});

/**
 * @desc    Update station details
 * @route   PUT /api/station
 * @access  Private
 */
exports.updateStation = asyncHandler(async (req, res) => {
  const {
    name,
    address,
    phone,
    email,
    bank_name,
    account_name,
    account_number,
    logo_url,
    invoice_prefix,
    receipt_prefix
  } = req.body;

  // Get station
  let station = await Station.getSingletonInstance();

  // Update fields
  if (name !== undefined) station.name = name;
  if (address !== undefined) station.address = address;
  if (phone !== undefined) station.phone = phone;
  if (email !== undefined) station.email = email;
  if (bank_name !== undefined) station.bank_name = bank_name;
  if (account_name !== undefined) station.account_name = account_name;
  if (account_number !== undefined) station.account_number = account_number;
  if (logo_url !== undefined) station.logo_url = logo_url;
  if (invoice_prefix !== undefined) station.invoice_prefix = invoice_prefix;
  if (receipt_prefix !== undefined) station.receipt_prefix = receipt_prefix;

  await station.save();

  res.status(200).json({
    success: true,
    data: station,
    message: 'Station updated successfully'
  });
});