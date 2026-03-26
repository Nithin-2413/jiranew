import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to N decimal places, stripping trailing zeros.
 * @param {number} value
 * @param {number} decimals - default 2
 * @returns {string}
 */
export const formatDecimal = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return parseFloat(Number(value).toFixed(decimals)).toString();
};

/**
 * Format large numbers with K / M / B suffixes.
 * @param {number} value
 * @returns {string}
 */
export const formatLargeNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  const n = Number(value);
  if (n >= 1_000_000_000) return formatDecimal(n / 1_000_000_000, 2) + 'B';
  if (n >= 1_000_000)     return formatDecimal(n / 1_000_000, 2) + 'M';
  if (n >= 1_000)         return formatDecimal(n / 1_000, 2) + 'K';
  return formatDecimal(n, 2);
};