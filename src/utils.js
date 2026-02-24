/**
 * Utility functions for MorseMaster
 * Provides general helper functions for common operations
 */

/**
 * Format time elapsed string (e.g., "5s", "2m")
 * @param {number} milliseconds - Time elapsed in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTimeElapsed(milliseconds) {
  const totalSeconds = Math.round(milliseconds / 1000);
  if (totalSeconds < 60) {
    return totalSeconds + 's';
  }
  return Math.round(totalSeconds / 60) + 'm';
}

/**
 * Create debounced version of function
 * @param {Function} fn - Function to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function createDebounced(fn, delayMs) {
  let timeoutId = null;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Create a deep copy of an object or array using JSON serialization
 * Safe for objects containing primitives, arrays, and nested objects.
 * Do not use with objects containing functions, Dates, or circular references.
 * @param {Object|Array} obj - Object or array to clone
 * @returns {Object|Array} Deep copy of the input
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
