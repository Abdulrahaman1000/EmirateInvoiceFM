// ============================================
// FILE: src/controllers/dashboardController.js
// Dashboard Summary Controller
// ============================================

const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get dashboard summary
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getDashboardSummary = asyncHandler(async (req, res) => {
  // Get all invoices
  const allInvoices = await Invoice.find();

  // Calculate totals
  const total_invoiced = allInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const total_paid = allInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const outstanding_balance = total_invoiced - total_paid;

  // Get total clients
  const total_clients = await Client.countDocuments({ isActive: true });

  // Get recent invoices (last 5)
  const recent_invoices = await Invoice.find()
    .populate('client_id', 'company_name')
    .sort({ invoice_date: -1 })
    .limit(5)
    .select('invoice_number invoice_date total_amount status client_id');

  // Get recent payments (last 5)
  const recent_payments = await Payment.find()
    .populate({
      path: 'invoice_id',
      select: 'invoice_number client_id',
      populate: {
        path: 'client_id',
        select: 'company_name'
      }
    })
    .sort({ date_received: -1 })
    .limit(5)
    .select('receipt_number amount_paid payment_method date_received');

  // Invoice status breakdown
  const status_breakdown = await Invoice.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total_amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      total_invoiced,
      total_paid,
      outstanding_balance,
      total_clients,
      recent_invoices,
      recent_payments,
      status_breakdown
    }
  });
});