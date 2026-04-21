/**
 * Centralized formatting utility for high-precision enterprise finance reporting.
 * Ensures UI consistency and prevents "NaN" or "Undefined" values in financial views.
 */

/**
 * Formats a numeric value as a currency string (Standardized to INR by default).
 * @param {number|string} amount - The numeric value to format.
 * @param {Object} options - Formatting options.
 * @returns {string} Fully formatted currency string with symbol.
 */
export const formatCurrency = (amount, options = {}) => {
  const { 
    currency = 'INR', 
    locale = 'en-IN', 
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }

  // Clamp values between 0-20 to avoid RangeError in Intl.NumberFormat
  const safeMin = Math.min(Math.max(minimumFractionDigits, 0), 20);
  const safeMax = Math.min(Math.max(maximumFractionDigits, 0), 20);
  const finalMaxFractionDigits = Math.max(safeMin, safeMax);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: safeMin,
    maximumFractionDigits: finalMaxFractionDigits,
  }).format(amount);
};

/**
 * Standardizes date formatting across the application to prevent timezone drift.
 * @param {string|Date} date - ISO string or Date object.
 * @param {string} type - Preset format type ('short', 'medium', 'full', 'compact').
 * @returns {string} Formatted date string (e.g., 25 Apr, 2026).
 */
export const formatDate = (date, type = 'medium') => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  switch (type) {
    case 'compact':
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    case 'short':
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    case 'full':
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });
    case 'iso':
      return d.toISOString().split('T')[0];
    case 'medium':
    default:
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
};

/**
 * Formats a number with industry-standard thousands separators.
 * @param {number} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Calculates percentage change between two values.
 * @param {number} current 
 * @param {number} previous 
 * @returns {string} E.g., "+12.5%" or "-3.2%"
 */
export const formatPercentChange = (current, previous) => {
  if (!previous || previous === 0) return '0%';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};
