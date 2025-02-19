/**
 * Format a number as TND (Tunisian Dinar) currency
 * @param {number} amount - The amount to format
 * @returns {string} The formatted amount
 */
export const formatTND = (amount) => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a date string to a readable format
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-TN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

/**
 * Format a time string to a readable format
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted time
 */
export const formatTime = (date) => {
  return new Intl.DateTimeFormat('fr-TN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}; 