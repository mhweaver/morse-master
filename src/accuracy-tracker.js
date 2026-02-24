/**
 * AccuracyTracker - Manages character accuracy statistics
 * Provides a self-documenting interface for tracking and querying accuracy data.
 */

import { CONTENT_GENERATION } from './constants.js';

/**
 * Tracks accuracy statistics for individual characters.
 * Maps each character to { correct: number, total: number }.
 * 
 * @example
 * const tracker = new AccuracyTracker();
 * tracker.recordAttempt('A', true);   // Correct attempt
 * tracker.recordAttempt('A', false);  // Incorrect attempt
 * tracker.getAccuracy('A');           // Returns 50
 * tracker.getWeakCharacters();        // Returns ['A']
 */
export class AccuracyTracker {
  /**
   * Initialize accuracy tracker with optional existing data
   * @param {Object.<string, {correct: number, total: number}>} [initialData={}] - Existing accuracy data
   */
  constructor(initialData = {}) {
    this.data = { ...initialData };
  }

  /**
   * Record an attempt for a character
   * @param {string} char - The character (must be uppercase)
   * @param {boolean} isCorrect - Whether the attempt was correct
   * @returns {void}
   * @public
   */
  recordAttempt(char, isCorrect) {
    if (!this.data[char]) {
      this.data[char] = { correct: 0, total: 0 };
    }
    this.data[char].total++;
    if (isCorrect) {
      this.data[char].correct++;
    }
  }

  /**
   * Get accuracy percentage for a specific character
   * @param {string} char - The character to check
   * @returns {number} Accuracy as percentage (0-100), or 0 if no attempts
   * @public
   */
  getAccuracy(char) {
    if (!this.data[char] || this.data[char].total === 0) {
      return 0;
    }
    return Math.round((this.data[char].correct / this.data[char].total) * 100);
  }

  /**
   * Get overall accuracy across all characters
   * @returns {number} Overall accuracy as percentage (0-100)
   * @public
   */
  getOverallAccuracy() {
    const totalCorrect = Object.values(this.data).reduce((sum, stat) => sum + stat.correct, 0);
    const totalAttempts = Object.values(this.data).reduce((sum, stat) => sum + stat.total, 0);
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  }

  /**
   * Get characters with weak accuracy (below threshold)
   * @param {number} [accuracyThreshold] - Accuracy percentage threshold (default from constants)
   * @param {number} [minAttempts] - Minimum attempts to be considered weak (default from constants)
   * @returns {string[]} Array of characters with weak accuracy
   * @public
   */
  getWeakCharacters(
    accuracyThreshold = CONTENT_GENERATION.COACH_WEAK_ACCURACY_THRESHOLD,
    minAttempts = CONTENT_GENERATION.COACH_WEAK_ATTEMPTS_THRESHOLD
  ) {
    return Object.entries(this.data)
      .filter(([_, stat]) =>
        stat.total > minAttempts &&
        (stat.correct / stat.total) < accuracyThreshold
      )
      .map(([char]) => char);
  }

  /**
   * Get raw data object (for storage/serialization)
   * Note: This returns a shallow copy, not a deep clone. For serialization/storage,
   * this object can be directly converted to JSON via JSON.stringify().
   * @returns {Object.<string, {correct: number, total: number}>} The underlying data
   * @public
   */
  toJSON() {
    return { ...this.data };
  }

  /**
   * Get all tracked characters
   * @returns {string[]} Array of all tracked characters
   * @public
   */
  getTrackedCharacters() {
    return Object.keys(this.data);
  }

  /**
   * Check if a character has been tracked
   * @param {string} char - The character to check
   * @returns {boolean} Whether the character has any recorded attempts
   * @public
   */
  hasCharacter(char) {
    return char in this.data && this.data[char].total > 0;
  }

  /**
   * Get total attempts across all characters
   * @returns {number} Total number of attempts
   * @public
   */
  getTotalAttempts() {
    return Object.values(this.data).reduce((sum, stat) => sum + stat.total, 0);
  }

  /**
   * Reset all accuracy data
   * @returns {void}
   * @public
   */
  reset() {
    this.data = {};
  }

  /**
   * Get accuracy data for a specific character (or null if not tracked)
   * @param {string} char - The character
   * @returns {{correct: number, total: number} | null} Accuracy data for the character
   * @public
   */
  getCharacterStats(char) {
    return this.data[char] || null;
  }
}

