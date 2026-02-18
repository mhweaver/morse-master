/**
 * ContentGenerator - Generates training challenges
 * Handles real content selection, synthetic challenge generation, and AI operations
 */

import {
  CONTENT_GENERATION,
  KOCH_SEQUENCE,
  AI_PROMPTS,
  AI_APIS,
  PLAYBACK_DELAYS,
  DICTIONARY,
  COMMON_ABBR,
  Q_CODES,
  PHRASES
} from './constants.js';
import {
  pickRandomItem,
  pickRandomCharacter,
  generateRandomCharacterGroup,
  generateSyntheticChallenge,
  cleanMorseText,
  getWeakCharacters
} from './utils.js';

export class ContentGenerator {
  constructor(accuracyData = {}) {
    this.accuracyData = accuracyData;
  }

  /**
   * Update accuracy data for weak character calculations
   * @param {Object} newAccuracyData - Character accuracy statistics
   * @public
   */
  updateAccuracyData(newAccuracyData) {
    this.accuracyData = newAccuracyData;
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

      const contentType = pickRandomItem(availableContentTypes);
      const selectedItem = pickRandomItem(contentPool[contentType]);

      challenge = typeof selectedItem === 'string' ? selectedItem : selectedItem.code;
      meaning = typeof selectedItem === 'string' ? '' : selectedItem.meaning;
    } else {
      // Generate synthetic challenge using random characters
      challenge = generateSyntheticChallenge(unlockedCharArray);
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
      const selectedAbbr = pickRandomItem(contentPool.abbrs);
      broadcastParts.push(selectedAbbr.code);
    }
    if (contentPool.words.length) {
      broadcastParts.push(pickRandomItem(contentPool.words));
    }
    if (Math.random() > 0.5 && contentPool.qcodes.length) {
      const selectedQCode = pickRandomItem(contentPool.qcodes);
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
    const weakCharacters = getWeakCharacters(this.accuracyData);
    const focusCharacters = weakCharacters.length > 0 ? weakCharacters : Array.from(this.getUnlockedSet(lessonLevel, manualChars));

    const groups = [];
    for (let i = 0; i < CONTENT_GENERATION.COACH_DRILL_GROUPS; i++) {
      groups.push(generateRandomCharacterGroup(focusCharacters, CONTENT_GENERATION.COACH_DRILL_GROUP_LENGTH));
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
    const weakCharacters = getWeakCharacters(this.accuracyData);
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
    const cleanedText = cleanMorseText(aiResponse);
    const unlockedSet = this.getUnlockedSet(lessonLevel, manualChars);
    const isValidText = cleanedText.split('').every(char => char === ' ' || unlockedSet.has(char));

    if (isValidText && cleanedText.trim()) {
      return { valid: true, cleaned: cleanedText.trim() };
    }
    return { valid: false };
  }
}
