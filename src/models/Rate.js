// ============================================
// FILE: src/models/Rate.js
// Service rate/pricing model
// ============================================

const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    // Examples: "Advert Spot", "Jingle Production", "Sponsored Programme", etc.
  },
  duration: {
    type: String,
    trim: true,
    // Examples: "30s", "60s", "60min", "90min"
  },
  time_slot: {
    type: String,
    trim: true,
    // Examples: "Prime", "Mid-Prime", "Off-Peak"
  },
  platform: {
    type: String,
    trim: true,
    // Examples: "Radio", "Facebook", "Instagram", "Twitter"
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching
rateSchema.index({ category: 1, duration: 1, time_slot: 1 });

// Method to format rate for display
rateSchema.methods.getDisplayName = function() {
  let parts = [this.category];
  
  if (this.duration) parts.push(this.duration);
  if (this.time_slot) parts.push(this.time_slot);
  if (this.platform) parts.push(this.platform);
  
  return parts.join(' - ');
};

// Static method to get rates by category
rateSchema.statics.getByCategory = async function(category) {
  return await this.find({ category, isActive: true }).sort({ price: 1 });
};

module.exports = mongoose.model('Rate', rateSchema);