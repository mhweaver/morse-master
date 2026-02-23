/**
 * Utility functions for MorseMaster
 * Provides general helper functions for common operations
 */

/**
 * Calculate overall accuracy percentage
 * @param {Object} accuracyData - Character accuracy object
 * @returns {number} Accuracy as percentage (0-100)
 */
export function calculateAccuracyPercentage(accuracyData) {
  const totalCorrect = Object.values(accuracyData).reduce((sum, data) => sum + data.correct, 0);
  const totalAttempts = Object.values(accuracyData).reduce((sum, data) => sum + data.total, 0);
  return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
}

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
