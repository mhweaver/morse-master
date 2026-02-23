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
