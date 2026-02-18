/**
 * Utility functions for MorseMaster
 * Provides helper functions for common operations, reducing code duplication
 */

import { CONTENT_GENERATION, MORSE_LIB } from './constants.js';

/**
 * Get characters that have weak accuracy based on accuracy history
 * @param {Object} accuracyData - Character accuracy object { char: { correct: n, total: n } }
 * @returns {string[]} Array of characters with weak accuracy
 */
export function getWeakCharacters(accuracyData) {
  return Object.entries(accuracyData)
    .filter(([_, accData]) =>
      accData.total > CONTENT_GENERATION.COACH_WEAK_ATTEMPTS_THRESHOLD &&
      accData.correct / accData.total < CONTENT_GENERATION.COACH_WEAK_ACCURACY_THRESHOLD
    )
    .map(([char]) => char);
}

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
 * Filter a list of items to only include those that use unlocked characters
 * @param {Array} items - Items to filter (strings or objects with 'code' property)
 * @param {Set} unlockedCharSet - Set of unlocked characters
 * @returns {Array} Filtered items
 */
export function filterByUnlockedChars(items, unlockedCharSet) {
  return items.filter(item => {
    const text = item.code || item;
    return text.split('').every(char => unlockedCharSet.has(char) || char === ' ');
  });
}

/**
 * Generate random character from array
 * @param {Array} characters - Array of characters
 * @returns {string} Random character
 */
export function pickRandomCharacter(characters) {
  return characters[Math.floor(Math.random() * characters.length)];
}

/**
 * Generate random item from array
 * @param {Array} items - Array of items
 * @returns {*} Random item
 */
export function pickRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
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
 * Validate that text contains only valid morse code characters
 * @param {string} text - Text to validate
 * @returns {boolean} True if all characters have morse equivalents
 */
export function isValidMorseText(text) {
  return text.split('').every(char => MORSE_LIB[char.toUpperCase()] || char === ' ');
}

/**
 * Clean text to only valid morse characters
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function cleanMorseText(text) {
  return text
    .toUpperCase()
    .split('')
    .filter(char => MORSE_LIB[char] || char === ' ')
    .join('')
    .trim();
}

/**
 * Generate random character group
 * @param {string[]} characters - Available characters
 * @param {number} length - Length of group
 * @returns {string} Generated group
 */
export function generateRandomCharacterGroup(characters, length) {
  let group = '';
  for (let i = 0; i < length; i++) {
    group += pickRandomCharacter(characters);
  }
  return group;
}

/**
 * Generate synthetic challenge (random character groups)
 * @param {string[]} unlockedCharacters - Available characters
 * @param {Object} config - Configuration with numGroups and groupLength
 * @returns {string} Generated synthetic challenge
 */
export function generateSyntheticChallenge(unlockedCharacters, config = {}) {
  const numGroupsRange = config.numGroupsRange || CONTENT_GENERATION.SYNTHETIC_GROUPS;
  const groupLengthRange = config.groupLengthRange || CONTENT_GENERATION.SYNTHETIC_GROUP_LENGTH;
  
  const numGroups = Math.floor(
    Math.random() * (numGroupsRange.max - numGroupsRange.min + 1)
  ) + numGroupsRange.min;
  
  const groups = [];
  for (let g = 0; g < numGroups; g++) {
    const len = Math.floor(
      Math.random() * (groupLengthRange.max - groupLengthRange.min + 1)
    ) + groupLengthRange.min;
    groups.push(generateRandomCharacterGroup(unlockedCharacters, len));
  }
  
  return groups.join(' ');
}
