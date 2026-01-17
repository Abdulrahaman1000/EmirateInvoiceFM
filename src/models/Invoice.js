// ============================================
// FILE: src/models/Invoice.js
// Invoice/Proforma model with VAT calculation
// ============================================

const mongoose = require('mongoose');

// Service line item schema (embedded)
const serviceLineSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  daily_slots: {
    type: Number,
    required: [true, 'Daily slots is required'],
    min: [1, 'Daily slots must be at least 1']
  },
  campaign_days: {
    type: Number,
    required: [true, 'Campaign days is required'],
    min: [1, 'Campaign days must be at least 1']
  },
  rate_per_slot: {
    type: Number,
    required: [true, 'Rate per slot is required'],
    min: [0, 'Rate cannot be negative']
  },
  total_slots: {
    type: Number
  },
  line_total: {
    type: Number
  }
}, { _id: false });

// Calculate totals before validation
serviceLineSchema.pre('validate', function() {
  this.total_slots = this.daily_slots * this.campaign_days;
  this.line_total = this.total_slots * this.rate_per_slot;
});

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  invoice_type: {
    type: String,
    required: true,
    enum: ['proforma', 'advance_bill'],
    default: 'proforma'
  },
  invoice_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  services: {
    type: [serviceLineSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one service is required'
    }
  },
  total_slots: {
    type: Number,
    required: true,
    default: 0
  },
  // NEW: Subtotal before VAT
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  // NEW: VAT rate (default 7.5%)
  vat_rate: {
    type: Number,
    default: 7.5,
    min: 0,
    max: 100
  },
  // NEW: VAT amount
  vat_amount: {
    type: Number,
    default: 0
  },
  // Total amount (subtotal + VAT)
  total_amount: {
    type: Number,
    required: true,
    default: 0
  },
  amount_in_words: {
    type: String,
    trim: true
  },
  advance_required: {
    type: Number,
    default: 0
  },
  amount_paid: {
    type: Number,
    default: 0
  },
  outstanding_balance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'partial', 'paid', 'cancelled'],
    default: 'pending'
  },
  payment_terms: {
    type: String,
    default: 'This bill is issued in advance and payment must be made before commencement of broadcast.',
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ client_id: 1, invoice_date: -1 });
invoiceSchema.index({ invoice_number: 1 });
invoiceSchema.index({ status: 1 });

// Calculate totals with VAT before saving
invoiceSchema.pre('save', async function() {
  if (this.services && this.services.length > 0) {
    // Calculate total slots
    this.total_slots = this.services.reduce((sum, service) => sum + service.total_slots, 0);
    
    // Calculate subtotal (before VAT)
    this.subtotal = this.services.reduce((sum, service) => sum + service.line_total, 0);
    
    // Calculate VAT amount
    this.vat_amount = Math.round((this.subtotal * this.vat_rate) / 100);
    
    // Calculate total amount (subtotal + VAT)
    this.total_amount = this.subtotal + this.vat_amount;
  }
  
  // If advance_required is not set or is 0, default to total_amount
  if (!this.advance_required || this.advance_required === 0) {
    this.advance_required = this.total_amount;
  }
  
  // Calculate outstanding balance
  this.outstanding_balance = this.total_amount - this.amount_paid;
  
  // Update status based on payment
  if (this.amount_paid === 0) {
    this.status = 'pending';
  } else if (this.amount_paid < this.total_amount) {
    this.status = 'partial';
  } else if (this.amount_paid >= this.total_amount) {
    this.status = 'paid';
  }
});

// Virtual for payments
invoiceSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'invoice_id'
});

// Method to update payment status
invoiceSchema.methods.updatePaymentStatus = async function() {
  const Payment = mongoose.model('Payment');
  const payments = await Payment.find({ invoice_id: this._id });
  
  this.amount_paid = payments.reduce((sum, payment) => sum + payment.amount_paid, 0);
  this.outstanding_balance = this.total_amount - this.amount_paid;
  
  if (this.amount_paid === 0) {
    this.status = 'pending';
  } else if (this.amount_paid < this.total_amount) {
    this.status = 'partial';
  } else {
    this.status = 'paid';
  }
  
  await this.save();
};

// Method to check if invoice can be edited
invoiceSchema.methods.canEdit = function() {
  return this.status !== 'paid' && this.status !== 'cancelled';
};

// Method to check if invoice can be deleted
invoiceSchema.methods.canDelete = function() {
  return this.status === 'draft' || (this.status === 'pending' && this.amount_paid === 0);
};

module.exports = mongoose.model('Invoice', invoiceSchema);