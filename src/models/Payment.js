// ============================================
// FILE: src/models/Payment.js
// Payment records model
// ============================================

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: [true, 'Invoice is required']
  },
  receipt_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  amount_paid: {
    type: Number,
    required: [true, 'Amount paid is required'],
    min: [0, 'Amount cannot be negative']
  },
  payment_method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'Bank Transfer', 'POS', 'Cheque'],
    default: 'Cash'
  },
  transaction_ref: {
    type: String,
    trim: true
    // For bank transfers, POS, or cheque numbers
  },
  date_received: {
    type: Date,
    required: true,
    default: Date.now
  },
  received_by: {
    type: String,
    required: [true, 'Receiver name is required'],
    trim: true
  },
  position: {
    type: String,
    trim: true
    // e.g., "Accounts Officer", "Manager"
  },
  notes: {
    type: String,
    trim: true
  },
  // Tracking
  invoice_balance_before: {
    type: Number,
    default: 0
  },
  invoice_balance_after: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ invoice_id: 1, date_received: -1 });
paymentSchema.index({ receipt_number: 1 });
paymentSchema.index({ date_received: -1 });

// Update invoice payment status after payment is saved
paymentSchema.post('save', async function() {
  try {
    const Invoice = mongoose.model('Invoice');
    const invoice = await Invoice.findById(this.invoice_id);
    
    if (invoice) {
      await invoice.updatePaymentStatus();
      
      // Update client financials
      const Client = mongoose.model('Client');
      const client = await Client.findById(invoice.client_id);
      if (client) {
        await client.updateFinancials();
      }
    }
  } catch (error) {
    console.error('Error updating invoice payment status:', error);
  }
});

// Virtual to get invoice details
paymentSchema.virtual('invoice', {
  ref: 'Invoice',
  localField: 'invoice_id',
  foreignField: '_id',
  justOne: true
});

// Method to format payment for receipt
paymentSchema.methods.getReceiptData = async function() {
  await this.populate('invoice');
  await this.invoice.populate('client_id');
  
  return {
    receipt_number: this.receipt_number,
    date_received: this.date_received,
    amount_paid: this.amount_paid,
    payment_method: this.payment_method,
    transaction_ref: this.transaction_ref,
    received_by: this.received_by,
    position: this.position,
    invoice: {
      invoice_number: this.invoice.invoice_number,
      invoice_date: this.invoice.invoice_date,
      total_amount: this.invoice.total_amount,
      outstanding_balance: this.invoice.outstanding_balance
    },
    client: {
      company_name: this.invoice.client_id.company_name,
      address: this.invoice.client_id.address,
      phone: this.invoice.client_id.phone,
      email: this.invoice.client_id.email
    }
  };
};

module.exports = mongoose.model('Payment', paymentSchema);