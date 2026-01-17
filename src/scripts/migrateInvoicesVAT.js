// ============================================
// FILE: scripts/migrateInvoicesVAT.js
// One-time migration script to add VAT to existing invoices
// ============================================

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_db_name');
    console.log('MongoDB Connected for migration...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateInvoices = async () => {
  try {
    const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
    
    // Find all invoices that don't have VAT fields
    const invoices = await Invoice.find({
      $or: [
        { subtotal: { $exists: false } },
        { vat_rate: { $exists: false } },
        { vat_amount: { $exists: false } }
      ]
    });

    console.log(`Found ${invoices.length} invoices to migrate...`);

    if (invoices.length === 0) {
      console.log('No invoices need migration. All invoices already have VAT fields.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const invoice of invoices) {
      try {
        // Calculate subtotal from services
        let subtotal = 0;
        if (invoice.services && invoice.services.length > 0) {
          subtotal = invoice.services.reduce((sum, service) => {
            const lineTotal = service.line_total || 
              (service.daily_slots * service.campaign_days * service.rate_per_slot);
            return sum + lineTotal;
          }, 0);
        } else {
          // If no services, use total_amount as subtotal (reverse calculate)
          // Assuming 7.5% VAT: total = subtotal * 1.075
          // So: subtotal = total / 1.075
          subtotal = Math.round(invoice.total_amount / 1.075);
        }

        // Set default VAT rate to 7.5%
        const vat_rate = 7.5;
        
        // Calculate VAT amount
        const vat_amount = Math.round((subtotal * vat_rate) / 100);
        
        // Calculate new total (subtotal + VAT)
        const total_amount = subtotal + vat_amount;

        // Update the invoice
        await Invoice.updateOne(
          { _id: invoice._id },
          {
            $set: {
              subtotal: subtotal,
              vat_rate: vat_rate,
              vat_amount: vat_amount,
              total_amount: total_amount
            }
          }
        );

        console.log(`✓ Migrated invoice ${invoice.invoice_number}`);
        console.log(`  Subtotal: ₦${subtotal.toLocaleString()}`);
        console.log(`  VAT (${vat_rate}%): ₦${vat_amount.toLocaleString()}`);
        console.log(`  Total: ₦${total_amount.toLocaleString()}`);
        console.log('');
        
        successCount++;
      } catch (error) {
        console.error(`✗ Error migrating invoice ${invoice.invoice_number}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total invoices processed: ${invoices.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('=========================\n');

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateInvoices();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateInvoices };