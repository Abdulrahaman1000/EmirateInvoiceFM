// ============================================
// FILE: src/routes/invoice.js
// Invoice/Proforma management routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generateInvoicePDF
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/invoices
 * @desc    List all invoices/proformas
 * @access  Private
 * @query   client_id - filter by client
 * @query   status - filter by status
 */
router.get('/invoices', protect, getInvoices);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get single invoice details
 * @access  Private
 */
router.get('/invoices/:id', protect, getInvoiceById);

/**
 * @route   POST /api/invoices
 * @desc    Create new proforma/invoice
 * @access  Private
 */
router.post('/invoices', protect, createInvoice);

/**
 * @route   PUT /api/invoices/:id
 * @desc    Update invoice (only if not fully paid)
 * @access  Private
 */
router.put('/invoices/:id', protect, updateInvoice);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete draft invoice
 * @access  Private
 */
router.delete('/invoices/:id', protect, deleteInvoice);

/**
 * @route   GET /api/invoices/:id/pdf
 * @desc    Generate and download Proforma/Invoice PDf
 * @access  Private
 */
router.get('/invoices/:id/pdf', protect, generateInvoicePDF);

module.exports = router;