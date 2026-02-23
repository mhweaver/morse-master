/**
 * ContentGenerator - Generates training challenges
 * Handles real content selection, synthetic challenge generation, and AI operations
 */

import {
  CONTENT_GENERATION,
  KOCH_SEQUENCE,
  AI_PROMPTS,
  DICTIONARY,
  COMMON_ABBR,
  Q_CODES,
  PHRASES,
  MORSE_LIB
} from './constants.js';
import { AccuracyTracker } from './accuracy-tracker.js';

/**
 * @typedef {import('./accuracy-tracker.js').AccuracyTracker} AccuracyTracker
 */

export class ContentGenerator {
  /**
   * @param {AccuracyTracker} [accuracyTracker=null] - Character accuracy tracker for weak character detection
   */
  constructor(accuracyTracker = null) {
    this.accuracyTracker = accuracyTracker || new AccuracyTracker();
  }

  /**
   * Generate random item from array
   * @param {Array} items - Array of items
   * @returns {*} Random item
   * @private
   */
  static #pickRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Generate random character from array
   * @param {Array} characters - Array of characters
   * @returns {string} Random character
   * @private
   */
  static #pickRandomCharacter(characters) {
    return characters[Math.floor(Math.random() * characters.length)];
  }

  /**
   * Generate random character group
   * @param {string[]} characters - Available characters
   * @param {number} length - Length of group
   * @returns {string} Generated group
   * @private
   */
  static #generateRandomCharacterGroup(characters, length) {
    let group = '';
    for (let i = 0; i < length; i++) {
      group += ContentGenerator.#pickRandomCharacter(characters);
    }
    return group;
  }

  /**
   * Generate synthetic challenge (random character groups)
   * @param {string[]} unlockedCharacters - Available characters
   * @param {Object} config - Configuration with numGroups and groupLength
   * @returns {string} Generated synthetic challenge
   * @private
   */
  static #generateSyntheticChallenge(unlockedCharacters, config = {}) {
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
      groups.push(ContentGenerator.#generateRandomCharacterGroup(unlockedCharacters, len));
    }
    
    return groups.join(' ');
  }

  /**
   * Clean text to only valid morse characters
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   * @private
   */
  static #cleanMorseText(text) {
    return text
      .toUpperCase()
      .split('')
      .filter(char => MORSE_LIB[char] || char === ' ')
      .join('')
      .trim();
  }

  /**
   * Filter a list of items to only include those that use unlocked characters
   * @param {Array} items - Items to filter (strings or objects with 'code' property)
   * @param {Set} unlockedCharSet - Set of unlocked characters
   * @returns {Array} Filtered items
   * @private
   */
  static #filterByUnlockedChars(items, unlockedCharSet) {
    return items.filter(item => {
      const text = item.code || item;
      return text.split('').every(char => unlockedCharSet.has(char) || char === ' ');
    });
  }

  /**
   * Update accuracy tracker
   * @param {AccuracyTracker} newAccuracyTracker - New accuracy tracker instance
   * @public
   */
  updateAccuracyData(newAccuracyTracker) {
    this.accuracyTracker = newAccuracyTracker;
  }

  /**
   * Get set of currently unlocked characters based on level
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Set<string>} Set of available characters
   * @public
   */
  getUnlockedSet(lessonLevel, manualChars = []) {
    const levelChars = KOCH_SEQUENCE.slice(0, lessonLevel);
    return new Set([...levelChars, ...manualChars]);
  }

  /**
   * Filter training content pools to only include unlocked characters
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} Object with filtered words, abbreviations, Q-codes, and phrases
   * @public
   */
  getFilteredPool(lessonLevel, manualChars = []) {
    const unlockedCharSet = this.getUnlockedSet(lessonLevel, manualChars);
    
    const filterByUnlocked = (items) => {
      return items.filter(item => {
        const text = item.code || item;
        return text.split('').every(char => unlockedCharSet.has(char) || char === ' ');
      });
    };

    return {
      words: filterByUnlocked(DICTIONARY),
      abbrs: filterByUnlocked(COMMON_ABBR),
      qcodes: filterByUnlocked(Q_CODES),
      phrases: filterByUnlocked(PHRASES)
    };
  }

  /**
   * Generate next training challenge (either real word or synthetic)
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string}
   * @public
   */
  generateChallenge(lessonLevel, manualChars = []) {
    const unlockedCharSet = this.getUnlockedSet(lessonLevel, manualChars);
    const unlockedCharArray = Array.from(unlockedCharSet);
    const contentPool = this.getFilteredPool(lessonLevel, manualChars);

    const hasContent = (contentPool.words.length + contentPool.abbrs.length +
      contentPool.qcodes.length + contentPool.phrases.length) > 0;
    const useRealContent = hasContent && Math.random() < CONTENT_GENERATION.REAL_CONTENT_PROBABILITY;

    let challenge = '';
    let meaning = '';

    if (useRealContent) {
      const availableContentTypes = [];
      if (contentPool.words.length) availableContentTypes.push('words');
      if (contentPool.abbrs.length) availableContentTypes.push('abbrs');
      if (contentPool.qcodes.length) availableContentTypes.push('qcodes');
      if (contentPool.phrases.length) availableContentTypes.push('phrases');

      const contentType = ContentGenerator.#pickRandomItem(availableContentTypes);
      const selectedItem = ContentGenerator.#pickRandomItem(contentPool[contentType]);

      challenge = typeof selectedItem === 'string' ? selectedItem : selectedItem.code;
      meaning = typeof selectedItem === 'string' ? '' : selectedItem.meaning;
    } else {
      // Generate synthetic challenge using random characters
      challenge = ContentGenerator.#generateSyntheticChallenge(unlockedCharArray);
    }

    return { challenge, meaning };
  }

  /**
   * Generate offline broadcast simulation
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string}
   * @public
   */
  generateOfflineBroadcast(lessonLevel, manualChars = []) {
    const contentPool = this.getFilteredPool(lessonLevel, manualChars);
    const broadcastParts = [];

    if (Math.random() > 0.5 && contentPool.abbrs.length) {
      const selectedAbbr = ContentGenerator.#pickRandomItem(contentPool.abbrs);
      broadcastParts.push(selectedAbbr.code);
    }
    if (contentPool.words.length) {
      broadcastParts.push(ContentGenerator.#pickRandomItem(contentPool.words));
    }
    if (Math.random() > 0.5 && contentPool.qcodes.length) {
      const selectedQCode = ContentGenerator.#pickRandomItem(contentPool.qcodes);
      broadcastParts.push(selectedQCode.code);
    }

    const unlockedSet = this.getUnlockedSet(lessonLevel, manualChars);
    const validParts = broadcastParts.filter(part =>
      part.split('').every(char => unlockedSet.has(char))
    );

    if (validParts.length > 0) {
      return {
        challenge: validParts.join(' '),
        meaning: 'Simulated Broadcast'
      };
    } else {
      // Fall back to synthetic
      const synthChallenge = this.generateChallenge(lessonLevel, manualChars);
      return {
        challenge: synthChallenge.challenge,
        meaning: 'Weak Signal (Synthetic)'
      };
    }
  }

  /**
   * Generate offline coach drill simulation
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string, hasWeakChars: boolean}
   * @public
   */
  generateOfflineCoach(lessonLevel, manualChars = []) {
    const weakCharacters = this.accuracyTracker.getWeakCharacters();
    const focusCharacters = weakCharacters.length > 0 ? weakCharacters : Array.from(this.getUnlockedSet(lessonLevel, manualChars));

    const groups = [];
    for (let i = 0; i < CONTENT_GENERATION.COACH_DRILL_GROUPS; i++) {
      groups.push(ContentGenerator.#generateRandomCharacterGroup(focusCharacters, CONTENT_GENERATION.COACH_DRILL_GROUP_LENGTH));
    }

    return {
      challenge: groups.join(' '),
      meaning: 'Smart Coach (Offline)',
      hasWeakChars: weakCharacters.length > 0
    };
  }

  /**
   * Generate AI broadcast prompt and validate response
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {prompt: string}
   * @public
   */
  getAIBroadcastPrompt(lessonLevel, manualChars = []) {
    const unlockedCharacters = Array.from(this.getUnlockedSet(lessonLevel, manualChars)).join(', ');
    return {
      prompt: AI_PROMPTS.BROADCAST(unlockedCharacters)
    };
  }

  /**
   * Generate AI coach prompt
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {prompt: string, hasWeakChars: boolean}
   * @public
   */
  getAICoachPrompt(lessonLevel, manualChars = []) {
    const weakCharacters = this.accuracyTracker.getWeakCharacters();
    const focusCharacters = weakCharacters.length > 0 ? weakCharacters : Array.from(this.getUnlockedSet(lessonLevel, manualChars));
    const allUnlockedCharacters = Array.from(this.getUnlockedSet(lessonLevel, manualChars)).join(', ');

    return {
      prompt: AI_PROMPTS.COACH(focusCharacters.join(', '), allUnlockedCharacters),
      hasWeakChars: weakCharacters.length > 0
    };
  }

  /**
   * Validate AI response matches unlocked characters
   * @param {string} aiResponse - Response text from AI
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {valid: boolean, cleaned?: string}
   * @public
   */
  validateAIResponse(aiResponse, lessonLevel, manualChars = []) {
    const cleanedText = ContentGenerator.#cleanMorseText(aiResponse);
    const unlockedSet = this.getUnlockedSet(lessonLevel, manualChars);
    const isValidText = cleanedText.split('').every(char => char === ' ' || unlockedSet.has(char));

    if (isValidText && cleanedText.trim()) {
      return { valid: true, cleaned: cleanedText.trim() };
    }
    return { valid: false };
  }

  /**
   * Generate a batch of broadcast challenges (for AI batch generation)
   * @param {number} batchSize - Number of challenges to generate
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object[]} Array of {challenge: string, meaning: string}
   * @public
   */
  generateBroadcastBatch(batchSize, lessonLevel, manualChars = []) {
    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(this.generateChallenge(lessonLevel, manualChars));
    }
    return batch;
  }

  /**
   * Generate a batch of smart coach challenges targeting weak characters
   * @param {number} batchSize - Number of challenges to generate
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {batch: Array, hasWeakChars: boolean}
   * @public
   */
  generateCoachBatch(batchSize, lessonLevel, manualChars = []) {
    const weakCharacters = this.accuracyTracker.getWeakCharacters();
    const hasWeakChars = weakCharacters.length > 0;

    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      // Generate challenges even if no weak chars, using all unlocked chars
      const focusCharacters = hasWeakChars ? weakCharacters : Array.from(this.getUnlockedSet(lessonLevel, manualChars));
      
      const groups = [];
      for (let j = 0; j < CONTENT_GENERATION.COACH_DRILL_GROUPS; j++) {
        groups.push(ContentGenerator.#generateRandomCharacterGroup(focusCharacters, CONTENT_GENERATION.COACH_DRILL_GROUP_LENGTH));
      }

      batch.push({
        challenge: groups.join(' '),
        meaning: 'Smart Coach Drill'
      });
    }

    return { batch, hasWeakChars };
  }
}
