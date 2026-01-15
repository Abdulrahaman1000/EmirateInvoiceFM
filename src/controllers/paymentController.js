// ============================================
// FILE: src/controllers/paymentController.js
// Payment & Receipt Management Controller
// ============================================

const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Station = require('../models/Station');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Private
 */
exports.getPayments = asyncHandler(async (req, res) => {
  const { invoice_id } = req.query;

  let query = {};

  // Filter by invoice
  if (invoice_id) {
    query.invoice_id = invoice_id;
  }

  const payments = await Payment.find(query)
    .populate({
      path: 'invoice_id',
      select: 'invoice_number invoice_date total_amount client_id',
      populate: {
        path: 'client_id',
        select: 'company_name'
      }
    })
    .sort({ date_received: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

/**
 * @desc    Get single payment
 * @route   GET /api/payments/:id
 * @access  Private
 */
exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({
      path: 'invoice_id',
      select: 'invoice_number invoice_date total_amount client_id',
      populate: {
        path: 'client_id',
        select: 'company_name address phone email'
      }
    });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

/**
 * @desc    Record new payment
 * @route   POST /api/payments
 * @access  Private
 */
exports.createPayment = asyncHandler(async (req, res) => {
  const {
    invoice_id,
    amount_paid,
    payment_method,
    transaction_ref,
    date_received,
    received_by,
    position,
    notes
  } = req.body;

  // Validate required fields
  if (!invoice_id || !amount_paid || !payment_method || !received_by) {
    return res.status(400).json({
      success: false,
      message: 'Invoice, amount, payment method, and receiver name are required'
    });
  }

  // Check if invoice exists
  const invoice = await Invoice.findById(invoice_id);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  // Check if payment amount is valid
  if (amount_paid <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount must be greater than 0'
    });
  }

  // Check if payment exceeds outstanding balance
  if (amount_paid > invoice.outstanding_balance) {
    return res.status(400).json({
      success: false,
      message: `Payment amount (₦${amount_paid.toLocaleString()}) exceeds outstanding balance (₦${invoice.outstanding_balance.toLocaleString()})`
    });
  }

  // Generate receipt number
  const station = await Station.getSingletonInstance();
  const receipt_number = await station.generateReceiptNumber();

  // Record balance before payment
  const invoice_balance_before = invoice.outstanding_balance;

  // Create payment
  const payment = await Payment.create({
    invoice_id,
    receipt_number,
    amount_paid,
    payment_method,
    transaction_ref,
    date_received: date_received || new Date(),
    received_by,
    position,
    notes,
    invoice_balance_before
  });

  // Invoice will be automatically updated via post-save hook
  // Refresh invoice to get updated values
  await invoice.updatePaymentStatus();
  
  payment.invoice_balance_after = invoice.outstanding_balance;
  await payment.save();

  // Populate payment data
  await payment.populate({
    path: 'invoice_id',
    select: 'invoice_number invoice_date total_amount outstanding_balance client_id',
    populate: {
      path: 'client_id',
      select: 'company_name'
    }
  });

  res.status(201).json({
    success: true,
    data: payment,
    invoice_balance: invoice.outstanding_balance,
    outstanding: invoice.outstanding_balance,
    message: 'Payment recorded successfully'
  });
});

/**
 * @desc    Generate receipt PDF
 * @route   GET /api/receipts/:payment_id/pdf
 * @access  Private
 */
exports.generateReceiptPDF = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.payment_id)
    .populate({
      path: 'invoice_id',
      populate: {
        path: 'client_id'
      }
    });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  const station = await Station.getSingletonInstance();

  // Generate PDF
  const pdfService = require('../services/pdfService');
  const pdfBuffer = await pdfService.generateReceiptPDF(payment, station);

  // Set headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=receipt-${payment.receipt_number.replace(/\//g, '-')}.pdf`
  );

  res.send(pdfBuffer);
});