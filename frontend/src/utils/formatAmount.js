/**
 * Format a monetary amount with the given ISO currency code and decimal separator.
 * Uses en-US locale as base (consistent symbol placement), then swaps separators
 * if the user prefers comma as the decimal separator.
 *
 * @param {number|string} amount - The numeric value (may be negative)
 * @param {string} currency - ISO 4217 code e.g. 'USD', 'EUR', 'GBP'
 * @param {'.'|','} decimalSep - User's preferred decimal separator
 * @returns {string}
 */
export function formatAmount(amount, currency, decimalSep = '.') {
  const value = parseFloat(amount)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  if (decimalSep === ',') {
    // Swap . (decimal) and , (grouping) by using a temp placeholder
    return formatted
      .replace(/,/g, '\x00')   // grouping , → temp
      .replace(/\./g, ',')     // decimal . → ,
      .replace(/\x00/g, '.')   // temp → .
  }

  return formatted
}
