// ============================================
// FILE: src/models/Station.js
// Station configuration model
// ============================================

const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Station name is required'],
    default: 'Emirate FM 98.5 FM'
  },
  address: {
    type: String,
    required: [true, 'Station address is required'],
    default: 'Behind Federal Ministry of Environment, Off Jebba Road, Ilorin, Kwara State, Nigeria.'
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  bank_name: {
    type: String,
    trim: true
  },
  account_name: {
    type: String,
    trim: true
  },
  account_number: {
    type: String,
    trim: true
  },
  logo_url: {
    type: String,
    trim: true
  },
  // Invoice configuration
  invoice_prefix: {
    type: String,
    default: 'EFM/ADV/',
    trim: true
  },
  invoice_counter: {
    type: Number,
    default: 0
  },
  receipt_prefix: {
    type: String,
    default: 'REC/',
    trim: true
  },
  receipt_counter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Only allow one station configuration
stationSchema.statics.getSingletonInstance = async function() {
  let station = await this.findOne();
  
  if (!station) {
    // Create default station if none exists
    station = await this.create({
      name: process.env.STATION_NAME || 'Emirate FM 98.5 FM',
      address: process.env.STATION_ADDRESS || 'Behind Federal Ministry of Environment, Off Jebba Road, Ilorin, Kwara State, Nigeria.',
      phone: process.env.STATION_PHONE || '',
      email: process.env.STATION_EMAIL || '',
      invoice_prefix: process.env.INVOICE_PREFIX || 'EFM/ADV/',
      receipt_prefix: process.env.RECEIPT_PREFIX || 'REC/'
    });
  }
  
  return station;
};

// Method to generate next invoice number
stationSchema.methods.generateInvoiceNumber = async function() {
  this.invoice_counter += 1;
  await this.save();
  
  const year = new Date().getFullYear();
  const paddedNumber = String(this.invoice_counter).padStart(3, '0');
  return `${this.invoice_prefix}${year}/${paddedNumber}`;
};

// Method to generate next receipt number
stationSchema.methods.generateReceiptNumber = async function() {
  this.receipt_counter += 1;
  await this.save();
  
  const year = new Date().getFullYear();
  const paddedNumber = String(this.receipt_counter).padStart(3, '0');
  return `${this.receipt_prefix}${year}/${paddedNumber}`;
};

module.exports = mongoose.model('Station', stationSchema);