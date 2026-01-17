// ============================================
// FILE: src/services/pdfService.js
// PDF Generation Service - Professional Styled with VAT
// ============================================

const PDFDocument = require('pdfkit');
const { formatCurrency, formatDate } = require('../utils/numberToWords');

/**
 * Generate Invoice/Proforma PDF with professional styling and VAT
 * @param {Object} invoice - Invoice object with populated client
 * @param {Object} station - Station details
 * @returns {Buffer} - PDF buffer
 */
exports.generateInvoicePDF = async (invoice, station) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('PDF Service: Starting invoice generation');
      
      // Validate required data
      if (!invoice) {
        throw new Error('Invoice data is required');
      }
      if (!invoice.client_id) {
        throw new Error('Invoice must have client information');
      }
      if (!invoice.services || invoice.services.length === 0) {
        throw new Error('Invoice must have at least one service');
      }

      const doc = new PDFDocument({ 
        margin: 40, 
        size: 'A4',
        bufferPages: true
      });
      
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log('PDF Service: Invoice buffer created, size:', pdfBuffer.length);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        console.error('PDF Service: PDFKit error:', err);
        reject(err);
      });

      // Colors
      const primaryColor = '#1e40af';
      const secondaryColor = '#3b82f6';
      const accentColor = '#f59e0b';
      const darkGray = '#374151';
      const lightGray = '#f3f4f6';

      // Helper function to safely format dates
      const safeFormatDate = (date) => {
        if (!date) return 'N/A';
        try {
          return formatDate(new Date(date));
        } catch (err) {
          return 'Invalid Date';
        }
      };

      // Helper function to safely format currency
      const safeFormatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '₦0.00';
        try {
          return formatCurrency(amount);
        } catch (err) {
          return `₦${amount.toLocaleString()}`;
        }
      };

      // ==================== HEADER ====================
      doc.rect(0, 0, 612, 80).fill(primaryColor);

      doc.fontSize(24)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text(station.name || 'Radio Station', 50, 25, { align: 'left' });

      doc.fontSize(10)
         .fillColor('#ffffff')
         .font('Helvetica')
         .text(station.address || '', 50, 55, { width: 300 });

      if (station.phone) {
        doc.fontSize(9).text(`Phone: ${station.phone}`, 400, 30, { align: 'right', width: 150 });
      }
      if (station.email) {
        doc.fontSize(9).text(`Email: ${station.email}`, 400, 45, { align: 'right', width: 150 });
      }

      if (station.rc_number) {
        doc.fontSize(8)
           .fillColor('#e5e7eb')
           .text(`RC: ${station.rc_number}`, 400, 60, { align: 'right', width: 150 });
      }

      doc.fillColor(darkGray);

      // ==================== INVOICE TITLE ====================
      doc.moveDown(3);
      const title = invoice.invoice_type === 'proforma' ? 'PROFORMA INVOICE' : 'ADVANCE BILL';
      
      const titleY = doc.y;
      doc.rect(40, titleY - 5, 532, 30).fill(lightGray);
      
      doc.fontSize(18)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(title, 50, titleY, { align: 'center' });

      doc.moveDown(2);

      // ==================== CLIENT & INVOICE INFO ====================
      const infoY = doc.y;

      doc.rect(40, infoY, 260, 100).stroke('#d1d5db');
      doc.fontSize(9)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, infoY + 10);

      doc.fontSize(11)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text(invoice.client_id.company_name || 'N/A', 50, infoY + 25);

      doc.fontSize(9)
         .font('Helvetica')
         .text(invoice.client_id.address || '', 50, infoY + 40, { width: 240 });

      if (invoice.client_id.phone) {
        doc.text(`Tel: ${invoice.client_id.phone}`, 50, infoY + 70);
      }
      if (invoice.client_id.email) {
        doc.text(`Email: ${invoice.client_id.email}`, 50, infoY + 82);
      }

      doc.rect(312, infoY, 260, 100).fill(lightGray).stroke('#d1d5db');

      const detailsX = 322;
      let detailY = infoY + 10;

      doc.fontSize(9).fillColor(darkGray).font('Helvetica-Bold');
      doc.text('Invoice Number:', detailsX, detailY);
      doc.font('Helvetica').text(invoice.invoice_number || 'N/A', detailsX + 110, detailY);

      detailY += 18;
      doc.font('Helvetica-Bold').text('Invoice Date:', detailsX, detailY);
      doc.font('Helvetica').text(safeFormatDate(invoice.invoice_date), detailsX + 110, detailY);

      detailY += 18;
      doc.font('Helvetica-Bold').text('Status:', detailsX, detailY);
      
      const statusColor = invoice.status === 'paid' ? '#10b981' : 
                         invoice.status === 'partial' ? accentColor : '#ef4444';
      doc.fillColor(statusColor)
         .font('Helvetica-Bold')
         .text((invoice.status || 'draft').toUpperCase(), detailsX + 110, detailY);

      detailY += 18;
      doc.fillColor(darkGray).font('Helvetica-Bold').text('Type:', detailsX, detailY);
      doc.font('Helvetica').text(
        invoice.invoice_type === 'proforma' ? 'Proforma' : 'Advance Bill',
        detailsX + 110,
        detailY
      );

      doc.fillColor(darkGray);
      doc.moveDown(8);

      // ==================== SERVICES TABLE ====================
      const tableTop = doc.y;
      
      doc.rect(40, tableTop, 532, 25).fill(primaryColor);

      const col1X = 50;
      const col2X = 220;
      const col3X = 300;
      const col4X = 360;
      const col5X = 420;
      const col6X = 500;

      doc.fontSize(9)
         .fillColor('#ffffff')
         .font('Helvetica-Bold');

      doc.text('DESCRIPTION', col1X, tableTop + 8);
      doc.text('DURATION', col2X, tableTop + 8);
      doc.text('SLOTS', col3X, tableTop + 8);
      doc.text('DAYS', col4X, tableTop + 8);
      doc.text('RATE', col5X, tableTop + 8);
      doc.text('TOTAL', col6X, tableTop + 8, { align: 'right' });

      let yPos = tableTop + 35;
      doc.fillColor(darkGray).font('Helvetica');

      invoice.services.forEach((service, index) => {
        if (index % 2 === 0) {
          doc.rect(40, yPos - 5, 532, 25).fill('#fafafa');
        }

        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        const lineTotal = service.line_total || 
                         (service.daily_slots * service.campaign_days * service.rate_per_slot);

        doc.fontSize(9).fillColor(darkGray);
        doc.text(service.description || 'Service', col1X, yPos, { width: 160 });
        doc.text(service.duration || '-', col2X, yPos);
        doc.text((service.daily_slots || 0).toString(), col3X, yPos);
        doc.text((service.campaign_days || 0).toString(), col4X, yPos);
        doc.text(safeFormatCurrency(service.rate_per_slot || 0), col5X, yPos, { width: 70 });
        doc.font('Helvetica-Bold')
           .text(safeFormatCurrency(lineTotal), col6X, yPos, { align: 'right', width: 62 });

        yPos += 25;
        doc.font('Helvetica');
      });

      // ==================== TOTALS SECTION WITH VAT ====================
      yPos += 10;
      
      doc.rect(350, yPos, 222, 130).fill(lightGray).stroke(primaryColor);

      yPos += 10;

      doc.fontSize(10).fillColor(darkGray).font('Helvetica-Bold');
      doc.text('Total Slots:', 370, yPos);
      doc.font('Helvetica').text((invoice.total_slots || 0).toString(), 520, yPos, { align: 'right' });

      yPos += 25;
      
      doc.font('Helvetica-Bold').text('SUBTOTAL:', 370, yPos);
      doc.font('Helvetica').text(safeFormatCurrency(invoice.subtotal || 0), 480, yPos, { align: 'right' });

      yPos += 20;
      
      const vatLabel = `VAT (${invoice.vat_rate || 7.5}%):`;
      doc.fillColor(darkGray).font('Helvetica').text(vatLabel, 370, yPos);
      doc.text(safeFormatCurrency(invoice.vat_amount || 0), 480, yPos, { align: 'right' });

      yPos += 25;
      
      doc.rect(350, yPos - 5, 222, 35).fill(primaryColor);
      doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('TOTAL AMOUNT PAYABLE:', 370, yPos + 5);
      doc.fontSize(14).text(safeFormatCurrency(invoice.total_amount || 0), 450, yPos + 5, { align: 'right' });

      yPos += 45;

      if (invoice.amount_in_words) {
        doc.fontSize(9)
           .fillColor(darkGray)
           .font('Helvetica-Oblique')
           .text(`Amount in Words: ${invoice.amount_in_words}`, 50, yPos, { width: 512 });
      }

      yPos += 30;

      // ==================== PAYMENT STATUS ====================
      if (invoice.amount_paid > 0) {
        doc.rect(350, yPos, 222, 60).fill('#f0fdf4').stroke('#10b981');

        doc.fontSize(9).fillColor(darkGray).font('Helvetica-Bold');
        doc.text('Amount Paid:', 370, yPos + 10);
        doc.fillColor('#10b981').text(safeFormatCurrency(invoice.amount_paid), 500, yPos + 10, { align: 'right' });

        doc.fillColor(darkGray).text('Outstanding:', 370, yPos + 30);
        doc.fillColor(accentColor).font('Helvetica-Bold')
           .text(safeFormatCurrency(invoice.outstanding_balance || 0), 500, yPos + 30, { align: 'right' });

        yPos += 70;
      }

      // ==================== PAYMENT TERMS ====================
      if (invoice.payment_terms) {
        yPos += 10;
        doc.rect(40, yPos, 532, 60).fill('#fef3c7').stroke(accentColor);
        
        doc.fontSize(10).fillColor(darkGray).font('Helvetica-Bold')
           .text('PAYMENT TERMS:', 50, yPos + 10);
        
        doc.fontSize(9).font('Helvetica')
           .text(invoice.payment_terms, 50, yPos + 25, { width: 512 });
        
        yPos += 70;
      }

      // ==================== BANK DETAILS ====================
      if (station.bank_name) {
        doc.rect(40, yPos, 532, 70).fill(lightGray).stroke(primaryColor);
        
        doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold')
           .text('BANK DETAILS:', 50, yPos + 10);
        
        doc.fontSize(9).fillColor(darkGray).font('Helvetica');
        doc.text(`Bank: ${station.bank_name}`, 50, yPos + 25);
        
        if (station.account_name) {
          doc.text(`Account Name: ${station.account_name}`, 50, yPos + 38);
        }
        if (station.account_number) {
          doc.text(`Account Number: ${station.account_number}`, 50, yPos + 51);
        }
      }

      // ==================== FOOTER ====================
      doc.fontSize(8)
         .fillColor('#6b7280')
         .font('Helvetica-Oblique')
         .text('Thank you for your business!', 50, 750, { align: 'center', width: 512 });

      console.log('PDF Service: Finalizing invoice document...');
      doc.end();

    } catch (error) {
      console.error('PDF Service: Invoice generation error:', error);
      reject(error);
    }
  });
};

/**
 * Generate Receipt PDF with enhanced professional design
 * @param {Object} payment - Payment object with populated invoice and client
 * @param {Object} station - Station details
 * @returns {Buffer} - PDF buffer
 */
exports.generateReceiptPDF = async (payment, station) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const invoice = payment.invoice_id;
      const client = invoice.client_id;
      const receiptDate = new Date(payment.date_received);

      const brandBlue = '#1e3a8a';
      const accentGold = '#f59e0b';
      const successGreen = '#10b981';
      const alertRed = '#ef4444';
      const lightBg = '#f8fafc';
      const mediumGray = '#64748b';
      const darkText = '#1e293b';
      const borderGray = '#cbd5e1';

      // ===================================
      // DECORATIVE HEADER
      // ===================================
      
      doc.rect(0, 0, 612, 100).fill(brandBlue);
      doc.rect(0, 90, 612, 10).fill('#2563eb');

      doc.fontSize(32)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('98.5', 50, 30);
      
      doc.fontSize(22)
         .text('EMIRATE FM', 130, 35);
      
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .fillColor('#e0e7ff')
         .text('The Voice of the North', 130, 63);

      const rcBoxX = 450;
      const rcBoxY = 35;
      doc.roundedRect(rcBoxX, rcBoxY, 112, 28, 4)
         .fill('#ffffff')
         .stroke();
      
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(mediumGray)
         .text('RECEIPT NO.', rcBoxX + 8, rcBoxY + 5);
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(brandBlue)
         .text(payment.receipt_number, rcBoxX + 8, rcBoxY + 15);

      // ===================================
      // DOCUMENT TITLE
      // ===================================
      doc.fillColor(darkText);
      doc.moveDown(3.5);
      
      const titleY = doc.y;
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(brandBlue)
         .text('PAYMENT RECEIPT', 50, titleY, { align: 'center', width: 512 });
      
      doc.moveTo(220, titleY + 25)
         .lineTo(392, titleY + 25)
         .lineWidth(2)
         .strokeColor(accentGold)
         .stroke();

      doc.moveDown(2);

      // ===================================
      // CLIENT INFORMATION
      // ===================================
      const clientBoxY = doc.y;
      
      doc.roundedRect(50, clientBoxY, 512, 95, 8)
         .fill(lightBg)
         .stroke(borderGray);
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(mediumGray)
         .text('RECEIVED FROM', 65, clientBoxY + 15);
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(darkText)
         .text(client.company_name, 65, clientBoxY + 32);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(mediumGray);
      
      if (client.address) {
        doc.text('● ' + client.address, 65, clientBoxY + 52, { width: 470 });
      }
      
      let detailY = clientBoxY + 68;
      if (client.phone) {
        doc.text('📞 ' + client.phone, 65, detailY);
        detailY += 12;
      }
      if (client.email) {
        doc.text('✉ ' + client.email, 65, detailY);
      }

      doc.moveDown(4);

      // ===================================
      // PAYMENT DETAILS
      // ===================================
      const detailsY = doc.y;
      
      doc.roundedRect(50, detailsY, 512, 25, 4)
         .fill(brandBlue);
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('PAYMENT INFORMATION', 65, detailsY + 8);

      const tableY = detailsY + 30;
      doc.roundedRect(50, tableY, 512, 140, 4)
         .stroke(borderGray);

      const labelX = 70;
      const valueX = 280;
      let rowY = tableY + 15;
      const rowHeight = 23;

      const details = [
        { label: 'Date Received', value: formatDate(receiptDate) },
        { label: 'Receipt Number', value: payment.receipt_number },
        { label: 'Invoice Reference', value: invoice.invoice_number },
        { label: 'Payment Method', value: payment.payment_method },
        ...(payment.transaction_ref ? [{ label: 'Transaction Ref', value: payment.transaction_ref }] : []),
        { label: 'Received By', value: `${payment.received_by}${payment.position ? ' · ' + payment.position : ''}` }
      ];

      details.forEach((detail, index) => {
        if (index % 2 === 0) {
          doc.rect(50, rowY - 5, 512, rowHeight).fill('#fafafa');
        }

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(mediumGray)
           .text(detail.label, labelX, rowY);
        
        doc.font('Helvetica-Bold')
           .fillColor(darkText)
           .text(detail.value, valueX, rowY, { width: 260 });
        
        rowY += rowHeight;
      });

      doc.moveDown(4);

      // ===================================
      // AMOUNT SECTION
      // ===================================
      const amountBoxY = doc.y;
      
      doc.roundedRect(50, amountBoxY, 512, 140, 8)
         .lineWidth(2)
         .strokeColor(brandBlue)
         .fill('#ffffff')
         .stroke();

      doc.roundedRect(50, amountBoxY, 512, 60, 8)
         .fill('#dbeafe');

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(brandBlue)
         .text('AMOUNT RECEIVED', 70, amountBoxY + 15);
      
      doc.fontSize(32)
         .font('Helvetica-Bold')
         .fillColor(brandBlue)
         .text(formatCurrency(payment.amount_paid), 70, amountBoxY + 30);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(darkText);

      let financeY = amountBoxY + 75;
      const financeLeftX = 70;
      const financeRightX = 480;

      doc.text('Invoice Total', financeLeftX, financeY);
      doc.font('Helvetica-Bold')
         .text(formatCurrency(invoice.total_amount), financeRightX, financeY, { align: 'right' });

      financeY += 18;
      doc.font('Helvetica')
         .fillColor(mediumGray)
         .text('Previous Payments', financeLeftX, financeY);
      doc.fillColor(successGreen)
         .text(formatCurrency(payment.invoice_balance_before - payment.amount_paid), financeRightX, financeY, { align: 'right' });

      financeY += 18;
      doc.fillColor(darkText)
         .font('Helvetica')
         .text('This Payment', financeLeftX, financeY);
      doc.fillColor(successGreen)
         .font('Helvetica-Bold')
         .text(formatCurrency(payment.amount_paid), financeRightX, financeY, { align: 'right' });

      financeY += 12;
      doc.moveTo(70, financeY)
         .lineTo(532, financeY)
         .strokeColor(borderGray)
         .stroke();

      financeY += 12;
      doc.fillColor(darkText)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Outstanding Balance', financeLeftX, financeY);
      
      const balanceColor = payment.invoice_balance_after === 0 ? successGreen : alertRed;
      doc.fillColor(balanceColor)
         .fontSize(13)
         .font('Helvetica-Bold')
         .text(formatCurrency(payment.invoice_balance_after), financeRightX, financeY, { align: 'right' });

      doc.moveDown(3);

      // ===================================
      // STATUS BADGE
      // ===================================
      if (payment.invoice_balance_after === 0) {
        const statusY = doc.y;
        doc.roundedRect(50, statusY, 512, 40, 8)
           .fill('#d1fae5')
           .stroke(successGreen);
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(successGreen)
           .text('✓ INVOICE FULLY PAID', 50, statusY + 13, {
             align: 'center',
             width: 512
           });
        
        doc.moveDown(1);
      } else {
        const statusY = doc.y;
        doc.roundedRect(50, statusY, 512, 40, 8)
           .fill('#fef3c7')
           .stroke(accentGold);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#92400e')
           .text('⚠ PARTIAL PAYMENT - BALANCE OUTSTANDING', 50, statusY + 13, {
             align: 'center',
             width: 512
           });
        
        doc.moveDown(1);
      }

      doc.moveDown(1);

      // ===================================
      // NOTES SECTION
      // ===================================
      if (payment.notes) {
        const notesY = doc.y;
        doc.roundedRect(50, notesY, 512, 60, 8)
           .fill('#fef9f3')
           .stroke('#fbbf24');
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(mediumGray)
           .text('NOTES', 65, notesY + 12);
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(darkText)
           .text(payment.notes, 65, notesY + 27, {
             width: 482,
             align: 'left'
           });
        
        doc.moveDown(1.5);
      }

      // ===================================
      // SIGNATURE
      // ===================================
      doc.moveDown(2);
      
      const sigY = doc.y;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(mediumGray)
         .text('Authorized Signature', 50, sigY);
      
      doc.moveDown(0.8);
      doc.moveTo(50, doc.y)
         .lineTo(200, doc.y)
         .strokeColor(borderGray)
         .stroke();

      // ===================================
      // FOOTER
      // ===================================
      const footerY = 720;

      doc.rect(0, footerY, 612, 122).fill(lightBg);
      
      doc.moveTo(50, footerY + 10)
         .lineTo(562, footerY + 10)
         .lineWidth(1)
         .strokeColor(accentGold)
         .stroke();

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(brandBlue)
         .text('CONTACT US', 50, footerY + 25, {
           width: 512,
           align: 'center'
         });

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(mediumGray)
         .text(
           station.address || 'Emirate Radio House, behind Federal Ministry of Environment,\noff old Jebba road, Ilorin, Kwara State, Nigeria',
           50,
           footerY + 40,
           { width: 512, align: 'center' }
         );

      let contactY = footerY + 65;
      if (station.phone) {
        doc.fillColor(darkText)
           .text(`📞 ${station.phone}`, 50, contactY, {
             width: 512,
             align: 'center'
           });
        contactY += 12;
      }

      if (station.email) {
        doc.fillColor(darkText)
           .text(`✉ ${station.email}`, 50, contactY, {
             width: 512,
             align: 'center'
           });
        contactY += 12;
      }

      if (station.website) {
        doc.fillColor(brandBlue)
           .font('Helvetica-Bold')
           .text(`🌐 ${station.website}`, 50, contactY, {
             width: 512,
             align: 'center'
           });
      }

      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .fillColor(mediumGray)
         .text('Thank you for your business!', 50, footerY + 100, {
           width: 512,
           align: 'center'
         });

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#94a3b8')
         .text(
           `Generated: ${new Date().toLocaleString('en-GB', {
             dateStyle: 'medium',
             timeStyle: 'short'
           })}`,
           50,
           footerY + 112,
           { align: 'center', width: 512 }
         );

      doc.end();

    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
};