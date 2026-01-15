// ============================================
// FILE: src/routes/payment.js
// Payment and receipt management routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
  generateReceiptPDF
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/payments
 * @desc    List all payments with optional filtering
 * @access  Private
 * @query   invoice_id - Filter payments by invoice ID
 * @example GET /api/payments?invoice_id=65647890a9ea5d062a34de1
 */
router.get('/payments', protect, getPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get single payment details by payment ID
 * @access  Private
 * @param   id - Payment MongoDB ObjectId
 * @example GET /api/payments/65647890a9ea5d062a34de1
 */
router.get('/payments/:id', protect, getPaymentById);

/**
 * @route   POST /api/payments
 * @desc    Record new payment and generate receipt
 * @access  Private
 * @body    {
 *   invoice_id: String (required),
 *   amount_paid: Number (required),
 *   payment_method: String (required) - "Cash"|"Bank Transfer"|"POS"|"Cheque",
 *   transaction_ref: String (optional),
 *   date_received: Date (optional, defaults to now),
 *   received_by: String (required),
 *   position: String (optional),
 *   notes: String (optional)
 * }
 * @example POST /api/payments
 * {
 *   "invoice_id": "65647890a9ea5d062a34de",
 *   "amount_paid": 1200000,
 *   "payment_method": "Bank Transfer",
 *   "transaction_ref": "TRF-20260109-001",
 *   "date_received": "2026-01-09",
 *   "received_by": "Aisha Mohammed",
 *   "position": "Accounts Officer",
 *   "notes": "Full payment for 30-day campaign"
 * }
 */
router.post('/payments', protect, createPayment);

/**
 * @route   GET /api/receipts/:payment_id/pdf
 * @desc    Generate and download receipt as PDF
 * @access  Private
 * @param   payment_id - Payment MongoDB ObjectId
 * @example GET /api/receipts/65647890a9ea5d062a34de1/pdf
 */
router.get('/receipts/:payment_id/pdf', protect, generateReceiptPDF);

module.exports = router;