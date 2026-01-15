// ============================================
// FILE: src/models/Client.js
// Client/customer model
// ============================================

const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  // Track total business
  total_invoiced: {
    type: Number,
    default: 0
  },
  total_paid: {
    type: Number,
    default: 0
  },
  outstanding_balance: {
    type: Number,
    default: 0
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
clientSchema.index({ company_name: 'text', email: 'text' });

// Virtual for invoice count
clientSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'client_id'
});

// Method to update financial totals
clientSchema.methods.updateFinancials = async function() {
  const Invoice = mongoose.model('Invoice');
  const Payment = mongoose.model('Payment');
  
  // Get all invoices for this client
  const invoices = await Invoice.find({ client_id: this._id });
  
  this.total_invoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  
  // Get all payments
  const invoiceIds = invoices.map(inv => inv._id);
  const payments = await Payment.find({ invoice_id: { $in: invoiceIds } });
  
  this.total_paid = payments.reduce((sum, pay) => sum + (pay.amount_paid || 0), 0);
  this.outstanding_balance = this.total_invoiced - this.total_paid;
  
  await this.save();
};

// Pre-remove hook to prevent deletion if invoices exist
clientSchema.pre('remove', async function(next) {
  const Invoice = mongoose.model('Invoice');
  const invoiceCount = await Invoice.countDocuments({ client_id: this._id });
  
  if (invoiceCount > 0) {
    throw new Error('Cannot delete client with existing invoices');
  }
  
  next();
});

module.exports = mongoose.model('Client', clientSchema);