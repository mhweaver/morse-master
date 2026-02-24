/**
 * DifficultyCalculator - Intelligent difficulty assessment and adaptation
 * Analyzes challenge characteristics and performance to dynamically adjust difficulty
 */

import { DIFFICULTY, DIFFICULTY_PRESETS, KOCH_SEQUENCE, MORSE_LIB } from './constants.js';

/**
 * Calculates the difficulty of morse code challenges based on multiple factors:
 * - Challenge length and complexity
 * - Character weak/strong spots
 * - New characters (grace period)
 * - Real content vs synthetic
 * 
 * Provides adaptive generation tailored to performance level.
 * 
 * @example
 * const calc = new DifficultyCalculator(accuracyTracker);
 * const diff = calc.calculateChallengeDifficulty('HELLO WORLD');
 * const challenge = calc.generateChallengeForDifficulty(5, unlockedChars);
 */
export class DifficultyCalculator {
  /**
   * Initialize difficulty calculator
   * @param {AccuracyTracker} accuracyTracker - Character accuracy data
   * @param {number} [difficultyPreference=3] - User difficulty preference (1-5)
   */
  constructor(accuracyTracker, difficultyPreference = 3) {
    this.accuracyTracker = accuracyTracker;
    this.difficultyConfig = { ...DIFFICULTY }; // Copy base config
    this.applyDifficultyPreset(difficultyPreference);
  }

  /**
   * Apply difficulty preset configuration
   * @param {number} preference - Difficulty preference (1-5)
   * @public
   */
  applyDifficultyPreset(preference) {
    const preset = DIFFICULTY_PRESETS[preference];
    if (preset) {
      // Override specific config values with preset values
      Object.assign(this.difficultyConfig, preset);
    }
  }

  /**
   * Calculate difficulty of a challenge string (1-10 scale)
   * Factors: character count, weak characters present, morse complexity
   * @param {string} challenge - Challenge text
   * @param {Set} unlockedChars - Set of unlocked characters
   * @param {number} [lessonsSinceNewChar=999] - Lessons since last new char added
   * @returns {number} Difficulty 1-10
   * @public
   */
  calculateChallengeDifficulty(challenge, unlockedChars, lessonsSinceNewChar = 999) {
    if (!challenge || !challenge.trim()) return DIFFICULTY.MODERATE;

    let difficulty = DIFFICULTY.MODERATE; // Start at 5

    // Factor 1: Length and complexity (up to ±3)
    difficulty += this.#calculateLengthFactor(challenge);

    // Factor 2: Weak characters present (down to -2)
    difficulty += this.#calculateWeakCharFactor(challenge);

    // Factor 3: New character grace period (down to -2)
    if (lessonsSinceNewChar < this.difficultyConfig.NEW_CHAR_DIFFICULTY_GRACE) {
      difficulty -= 2;
    }

    // Factor 4: Morse code complexity (up to ±2)
    difficulty += this.#calculateMorseComplexity(challenge);

    // Clamp to valid range
    return Math.max(DIFFICULTY.DIFFICULTY_SCALE_MIN, Math.min(DIFFICULTY.DIFFICULTY_SCALE_MAX, difficulty));
  }

  /**
   * Calculate length and complexity factor
   * Longer challenges and those with spaces are easier (spread out)
   * Single long words are harder (denser)
   * @private
   */
  #calculateLengthFactor(challenge) {
    const words = challenge.trim().split(/\s+/);
    const totalChars = challenge.replace(/\s/g, '').length;

    // Single word, many characters = harder
    if (words.length === 1 && totalChars >= 8) {
      return 2; // +2 difficulty
    }
    // Multiple words or few characters = easier
    if (words.length >= 2 || totalChars <= 3) {
      return -1; // -1 difficulty
    }
    return 0;
  }

  /**
   * Calculate weak character presence factor
   * Presence of weak characters reduces difficulty during practice
   * @private
   */
  #calculateWeakCharFactor(challenge) {
    const weakChars = this.accuracyTracker.getWeakCharacters();
    if (weakChars.length === 0) return 0;

    const textChars = challenge.toUpperCase().split('').filter(c => c !== ' ');
    const hasWeak = textChars.some(c => weakChars.includes(c));

    if (hasWeak) {
      return -1; // Slightly easier when weak chars present
    }
    return 0;
  }

  /**
   * Calculate morse code complexity
   * Some characters are inherently harder (more dots/dashes)
   * @private
   */
  #calculateMorseComplexity(challenge) {
    const textChars = challenge.toUpperCase().split('').filter(c => c !== ' ' && MORSE_LIB[c]);
    if (textChars.length === 0) return 0;

    const avgComplexity = textChars.reduce((sum, char) => {
      const morse = MORSE_LIB[char] || '';
      return sum + morse.length; // Longer morse = more complex
    }, 0) / textChars.length;

    // Average morse is ~4, complex>5, simple<3
    if (avgComplexity > 5) return 1;
    if (avgComplexity < 3) return -1;
    return 0;
  }

  /**
   * Get recommended difficulty based on recent performance
   * Adapts based on overall accuracy
   * @param {number} [currentDifficulty=5] - Current difficulty level (1-10)
   * @param {number} [recentAccuracy=null] - Recent accuracy percentage (0-100)
   * @returns {number} Recommended difficulty 1-10
   * @public
   */
  getRecommendedDifficulty(currentDifficulty = 5, recentAccuracy = null) {
    const accuracy = recentAccuracy ?? this.accuracyTracker.getOverallAccuracy();

    if (accuracy >= this.difficultyConfig.EXCELLENT_PERFORMANCE_THRESHOLD * 100) {
      // Increase difficulty
      return Math.min(DIFFICULTY.DIFFICULTY_SCALE_MAX, currentDifficulty * DIFFICULTY.DIFFICULTY_UP_FACTOR);
    } else if (accuracy >= DIFFICULTY.GOOD_PERFORMANCE_THRESHOLD * 100) {
      // Maintain or slightly increase
      return Math.min(DIFFICULTY.DIFFICULTY_SCALE_MAX, currentDifficulty * 1.1);
    } else if (accuracy >= DIFFICULTY.FAIR_PERFORMANCE_THRESHOLD * 100) {
      // Maintain
      return currentDifficulty;
    } else if (accuracy >= this.difficultyConfig.POOR_PERFORMANCE_THRESHOLD * 100) {
      // Maintain at lower threshold
      return currentDifficulty;
    } else {
      // Decrease difficulty
      return Math.max(DIFFICULTY.DIFFICULTY_SCALE_MIN, currentDifficulty * DIFFICULTY.DIFFICULTY_DOWN_FACTOR);
    }
  }

  /**
   * Determine if should apply new character grace period
   * Returns true if a new character was recently unlocked
   * @param {number} previousLevel - Previous lesson level
   * @param {number} currentLevel - Current lesson level
   * @returns {number} Lessons since new character (0 if new, 999 if none)
   * @public
   */
  getNewCharacterGracePeriod(previousLevel, currentLevel) {
    if (currentLevel > previousLevel) {
      return 0; // Just added a new character
    }
    return 999; // No new character
  }

  /**
   * Check if character is strong (>80% accuracy minimum attempts)
   * @param {string} char - Character to check
   * @returns {boolean}
   * @public
   */
  isCharStrong(char) {
    const accuracy = this.accuracyTracker.getAccuracy(char);
    const data = this.accuracyTracker.data[char];
    if (!data || data.total < 3) return false; // Need minimum attempts
    return accuracy >= 80;
  }

  /**
   * Get summary of character difficulty levels
   * Useful for adaptive content selection
   * @param {string[]} characters - Characters to analyze
   * @returns {Object} {weak: [], moderate: [], strong: []}
   * @public
   */
  categorizeCharacters(characters) {
    const weak = [];
    const moderate = [];
    const strong = [];

    characters.forEach(char => {
      const accuracy = this.accuracyTracker.getAccuracy(char);
      if (accuracy < 60) weak.push(char);
      else if (accuracy < 85) moderate.push(char);
      else strong.push(char);
    });

    return { weak, moderate, strong };
  }

  /**
   * Score a completed challenge for difficulty appropriateness
   * Returns how well the difficulty matched the user's actual performance
   * @param {string} challenge - The challenge presented
   * @param {number} estimatedDifficulty - Calculated difficulty
   * @param {boolean} userSuccess - Whether user got it correct
   * @returns {Object} {appropriate: boolean, feedback: string}
   * @public
   */
  scoreDifficultyMatch(challenge, estimatedDifficulty, userSuccess) {
    const successRate = this.accuracyTracker.getOverallAccuracy() / 100;
    
    // Expected success rate varies with difficulty
    // At difficulty 5 (medium): expect 75% success
    // At difficulty 1 (easy): expect 95% success
    // At difficulty 10 (hard): expect 40% success
    const expectedSuccessRate = 0.95 - (estimatedDifficulty - 1) * 0.055;
    
    // Check if performance matched difficulty
    const isAppropriate = Math.abs(successRate - expectedSuccessRate) < 0.2;

    let feedback = '';
    if (userSuccess) {
      if (estimatedDifficulty >= 8) {
        feedback = 'Excellent! That was challenging.';
      } else if (estimatedDifficulty <= 2) {
        feedback = 'Perfect! Try harder challenges next.';
      } else {
        feedback = 'Good work!';
      }
    } else {
      if (estimatedDifficulty >= 8) {
        feedback = 'That was tough. Let\'s ease up.';
      } else {
        feedback = 'Keep practicing this level.';
      }
    }

    return { appropriate: isAppropriate, feedback };
  }

  /**
   * Update accuracy tracker reference
   * @param {AccuracyTracker} newTracker
   * @public
   */
  updateAccuracyTracker(newTracker) {
    this.accuracyTracker = newTracker;
  }
}
