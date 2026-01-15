// ============================================
// FILE: src/controllers/invoiceController.js
// Invoice/Proforma Management Controller
// ============================================

const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Station = require('../models/Station');
const asyncHandler = require('../middleware/asyncHandler');
const { convertNumberToWords } = require('../utils/numberToWords');

/**
 * @desc    Get all invoices
 * @route   GET /api/invoices
 * @access  Private
 */
exports.getInvoices = asyncHandler(async (req, res) => {
  const { client_id, status } = req.query;

  let query = {};

  // Filter by client
  if (client_id) {
    query.client_id = client_id;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  const invoices = await Invoice.find(query)
    .populate('client_id', 'company_name address phone email')
    .sort({ invoice_date: -1 });

  res.status(200).json({
    success: true,
    count: invoices.length,
    data: invoices
  });
});

/**
 * @desc    Get single invoice
 * @route   GET /api/invoices/:id
 * @access  Private
 */
exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('client_id', 'company_name address phone email');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

/**
 * @desc    Create new invoice
 * @route   POST /api/invoices
 * @access  Private
 */
exports.createInvoice = asyncHandler(async (req, res) => {
  const {
    client_id,
    invoice_type,
    invoice_date,
    services,
    advance_required,
    payment_terms,
    notes
  } = req.body;

  // Validate required fields
  if (!client_id || !services || services.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Client and at least one service are required'
    });
  }

  // Check if client exists
  const client = await Client.findById(client_id);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Generate invoice number
  const station = await Station.getSingletonInstance();
  const invoice_number = await station.generateInvoiceNumber();

  // Create invoice
  const invoice = await Invoice.create({
    invoice_number,
    client_id,
    invoice_type: invoice_type || 'proforma',
    invoice_date: invoice_date || new Date(),
    services,
    advance_required,
    payment_terms,
    notes
  });

  // Convert amount to words
  invoice.amount_in_words = convertNumberToWords(invoice.total_amount);
  await invoice.save();

  // Update client financials
  if (client.updateFinancials) {
    await client.updateFinancials();
  }

  // Populate client data
  await invoice.populate('client_id', 'company_name address phone email');

  res.status(201).json({
    success: true,
    data: invoice,
    message: 'Invoice created successfully'
  });
});

/**
 * @desc    Update invoice
 * @route   PUT /api/invoices/:id
 * @access  Private
 */
exports.updateInvoice = asyncHandler(async (req, res) => {
  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  // Check if invoice can be edited
  if (!invoice.canEdit()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot edit a paid or cancelled invoice'
    });
  }

  // Update allowed fields
  const allowedUpdates = [
    'invoice_type',
    'invoice_date',
    'services',
    'advance_required',
    'payment_terms',
    'notes',
    'status'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      invoice[field] = req.body[field];
    }
  });

  await invoice.save();

  // Update amount in words after totals are recalculated
  if (invoice.total_amount) {
    invoice.amount_in_words = convertNumberToWords(invoice.total_amount);
    await invoice.save();
  }

  // Update client financials
  const client = await Client.findById(invoice.client_id);
  if (client && client.updateFinancials) {
    await client.updateFinancials();
  }

  await invoice.populate('client_id', 'company_name address phone email');

  res.status(200).json({
    success: true,
    data: invoice,
    message: 'Invoice updated successfully'
  });
});

/**
 * @desc    Delete invoice
 * @route   DELETE /api/invoices/:id
 * @access  Private
 */
exports.deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  // Check if invoice can be deleted
  if (!invoice.canDelete()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete invoice with payments or non-draft status'
    });
  }

  await invoice.deleteOne();

  // Update client financials
  const client = await Client.findById(invoice.client_id);
  if (client && client.updateFinancials) {
    await client.updateFinancials();
  }

  res.status(200).json({
    success: true,
    message: 'Invoice deleted successfully'
  });
});

/**
 * @desc    Generate invoice PDF
 * @route   GET /api/invoices/:id/pdf
 * @access  Private
 */
exports.generateInvoicePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('client_id', 'company_name address phone email');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  const station = await Station.getSingletonInstance();

  // Check if pdfService exists
  let pdfService;
  try {
    pdfService = require('../services/pdfService');
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'PDF service not configured. Please create src/services/pdfService.js'
    });
  }

  // Generate PDF
  try {
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice, station);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoice.invoice_number.replace(/\//g, '-')}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating PDF: ' + error.message
    });
  }
});