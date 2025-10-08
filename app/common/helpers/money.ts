/**
 * Money formatting utilities for the application
 * Ensures consistent 2-decimal formatting for all monetary values
 */

/**
 * Format a number to exactly 2 decimal places
 * @param value - The number to format
 * @returns The formatted number with 2 decimal places
 */
export function formatMoney(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return '0.00'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '0.00'
  }

  return numValue.toFixed(2)
}

/**
 * Format a number with currency symbol and 2 decimal places
 * @param value - The number to format
 * @param currencySymbol - The currency symbol to prepend
 * @returns The formatted currency string
 */
export function formatCurrency(
  value: number | string | undefined | null,
  currencySymbol: string = '$'
): string {
  const formattedValue = formatMoney(value)
  return `${currencySymbol}${formattedValue}`
}

/**
 * Parse a monetary value and ensure it's rounded to 2 decimal places
 * @param value - The value to parse and round
 * @returns The parsed and rounded number
 */
export function parseMoney(value: number | string | undefined | null): number {
  if (value === undefined || value === null || value === '') {
    return 0
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return 0
  }

  return Math.round(numValue * 100) / 100
}

/**
 * Round a monetary value to 2 decimal places
 * @param value - The value to round
 * @returns The rounded number
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
