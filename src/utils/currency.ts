/**
 * Formats a number into Indian Rupee Currency format (e.g. ₹8,00,000 or ₹25,000)
 */
export function formatINR(amount: number | string | null | undefined, includeSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return includeSymbol ? '₹0' : '0';
  }

  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Use Intl with en-IN locale
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absNum);

  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';

  return `${prefix}${symbol}${formatted}`;
}

/**
 * Compact Indian currency formatter for charts/compact badges (e.g., ₹1.5L, ₹50K)
 */
export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return formatINR(amount);
}

/**
 * Parses user input currency string back to standard number
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
