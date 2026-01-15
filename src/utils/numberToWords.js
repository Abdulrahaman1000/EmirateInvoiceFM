// ============================================
// FILE: src/utils/numberToWords.js
// Number formatting and conversion utilities
// ============================================

/**
 * Convert number to words (Naira)
 * @param {Number} amount - Amount to convert
 * @returns {String} - Amount in words
 */
exports.convertNumberToWords = (amount) => {
  if (amount === 0) return 'Zero Naira Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one ? ' ' + ones[one] : '');
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return ones[hundred] + ' Hundred' + (remainder ? ' and ' + convertLessThanThousand(remainder) : '');
  };

  const convertNumber = (n) => {
    if (n === 0) return 'Zero';
    
    const billion = Math.floor(n / 1000000000);
    const million = Math.floor((n % 1000000000) / 1000000);
    const thousand = Math.floor((n % 1000000) / 1000);
    const remainder = n % 1000;

    let result = '';

    if (billion) {
      result += convertLessThanThousand(billion) + ' Billion ';
    }
    if (million) {
      result += convertLessThanThousand(million) + ' Million ';
    }
    if (thousand) {
      result += convertLessThanThousand(thousand) + ' Thousand ';
    }
    if (remainder) {
      result += convertLessThanThousand(remainder);
    }

    return result.trim();
  };

  const naira = Math.floor(amount);
  const kobo = Math.round((amount - naira) * 100);

  let result = convertNumber(naira) + ' Naira';
  
  if (kobo > 0) {
    result += ' and ' + convertNumber(kobo) + ' Kobo';
  }
  
  return result + ' Only';
};

/**
 * Format number as currency (Naira)
 * @param {Number} amount - Amount to format
 * @returns {String} - Formatted currency string
 */
exports.formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₦0.00';
  
  return '₦' + amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {String} - Formatted date string
 */
exports.formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format date to short string (DD/MM/YYYY)
 * @param {Date} date - Date to format
 * @returns {String} - Formatted date string
 */
exports.formatDateShort = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Parse date from string
 * @param {String} dateString - Date string to parse
 * @returns {Date} - Parsed date
 */
exports.parseDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString);
};