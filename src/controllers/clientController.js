// ============================================
// FILE: src/controllers/clientController.js
// Client Management Controller - WITH CASCADE DELETE
// ============================================

const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Private
 */
exports.getClients = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = { isActive: true };

  // Search by company name
  if (search) {
    query.company_name = { $regex: search, $options: 'i' };
  }

  const clients = await Client.find(query).sort({ company_name: 1 });

  res.status(200).json({
    success: true,
    count: clients.length,
    data: clients
  });
});

/**
 * @desc    Get single client by ID
 * @route   GET /api/clients/:id
 * @access  Private
 */
exports.getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.status(200).json({
    success: true,
    data: client
  });
});

/**
 * @desc    Create new client
 * @route   POST /api/clients
 * @access  Private
 */
exports.createClient = asyncHandler(async (req, res) => {
  const { company_name, address, phone, email } = req.body;

  // Validate required fields
  if (!company_name || !address) {
    return res.status(400).json({
      success: false,
      message: 'Company name and address are required'
    });
  }

  // Check if client already exists
  const existingClient = await Client.findOne({
    company_name: { $regex: `^${company_name}$`, $options: 'i' }
  });

  if (existingClient) {
    return res.status(400).json({
      success: false,
      message: 'Client with this company name already exists'
    });
  }

  // Create client
  const client = await Client.create({
    company_name,
    address,
    phone,
    email
  });

  res.status(201).json({
    success: true,
    data: client,
    message: 'Client created successfully'
  });
});

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private
 */
exports.updateClient = asyncHandler(async (req, res) => {
  let client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Update client
  client = await Client.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: client,
    message: 'Client updated successfully'
  });
});

/**
 * @desc    Delete client (WITH CASCADE DELETE FOR TESTING)
 * @route   DELETE /api/clients/:id
 * @access  Private
 */
exports.deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // ===== CASCADE DELETE FOR TESTING =====
  // Find all invoices for this client
  const invoices = await Invoice.find({ client_id: client._id });
  const invoiceIds = invoices.map(inv => inv._id);
  
  let deletedInvoices = 0;
  let deletedPayments = 0;

  if (invoiceIds.length > 0) {
    // Delete all payments for these invoices
    const paymentDeleteResult = await Payment.deleteMany({ 
      invoice_id: { $in: invoiceIds } 
    });
    deletedPayments = paymentDeleteResult.deletedCount || 0;

    // Delete all invoices for this client
    const invoiceDeleteResult = await Invoice.deleteMany({ 
      client_id: client._id 
    });
    deletedInvoices = invoiceDeleteResult.deletedCount || 0;
  }

  // Finally, delete the client
  await client.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Client and related data deleted successfully',
    deletedData: {
      client: client.company_name,
      invoices: deletedInvoices,
      payments: deletedPayments
    }
  });
});