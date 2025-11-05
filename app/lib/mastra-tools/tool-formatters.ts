/**
 * Tool Output Formatters
 *
 * Markdown formatting utilities for tool responses
 * Based on plan.md: Tools return markdown-formatted output for streaming display
 */

/**
 * Format a table in markdown
 */
export function formatTable(headers: string[], rows: string[][]): string {
  if (headers.length === 0 || rows.length === 0) {
    return ''
  }

  const headerRow = `| ${headers.join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const dataRows = rows.map((row) => `| ${row.join(' | ')} |`).join('\n')

  return `${headerRow}\n${separator}\n${dataRows}`
}

/**
 * Format a list in markdown
 */
export function formatList(items: string[], ordered = false): string {
  if (items.length === 0) {
    return ''
  }

  if (ordered) {
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n')
  }

  return items.map((item) => `- ${item}`).join('\n')
}

/**
 * Format key-value pairs in markdown
 */
export function formatKeyValue(
  pairs: Record<string, string | number | boolean | null | undefined>
): string {
  const entries = Object.entries(pairs).filter(([_, value]) => value !== undefined)

  if (entries.length === 0) {
    return ''
  }

  return entries.map(([key, value]) => `**${key}**: ${value ?? 'N/A'}`).join('\n')
}

/**
 * Format a success message with optional details
 */
export function formatSuccess(
  message: string,
  details?: Record<string, string | number | boolean | null | undefined>
): string {
  let output = `✅ ${message}`

  if (details) {
    output += '\n\n' + formatKeyValue(details)
  }

  return output
}

/**
 * Format an error message with optional suggestion
 */
export function formatError(error: string, suggestion?: string): string {
  let output = `❌ **Error**: ${error}`

  if (suggestion) {
    output += `\n\n💡 **Suggestion**: ${suggestion}`
  }

  return output
}

/**
 * Format a warning message
 */
export function formatWarning(message: string): string {
  return `⚠️ **Warning**: ${message}`
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format number with commas
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
