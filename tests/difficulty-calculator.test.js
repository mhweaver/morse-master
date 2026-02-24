/**
 * Tests for DifficultyCalculator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DifficultyCalculator } from '../src/difficulty-calculator.js';
import { AccuracyTracker } from '../src/accuracy-tracker.js';
import { DIFFICULTY } from '../src/constants.js';

describe('DifficultyCalculator', () => {
  let tracker;
  let calculator;

  beforeEach(() => {
    tracker = new AccuracyTracker();
    calculator = new DifficultyCalculator(tracker);
  });

  describe('Difficulty Calculation', () => {
    it('should calculate difficulty for simple single character', () => {
      const unlockedChars = new Set(['K']);
      const difficulty = calculator.calculateChallengeDifficulty('K', unlockedChars);

      expect(difficulty).toBeGreaterThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MIN);
      expect(difficulty).toBeLessThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MAX);
      // Single char should be easier
      expect(difficulty).toBeLessThan(5);
    });

    it('should calculate higher difficulty for longer challenges', () => {
      const unlockedChars = new Set(['K', 'M', 'R', 'S', 'U', 'A']);
      const shortDiff = calculator.calculateChallengeDifficulty('KM', unlockedChars);
      const longDiff = calculator.calculateChallengeDifficulty('KUBERNETES', unlockedChars);

      expect(longDiff).toBeGreaterThan(shortDiff);
    });

    it('should reduce difficulty when weak characters are present', () => {
      const unlockedChars = new Set(['K', 'M', 'R']);

      // Set R as weak character
      tracker.data = {
        'K': { correct: 90, incorrect: 10, total: 100 },
        'M': { correct: 90, incorrect: 10, total: 100 },
        'R': { correct: 40, incorrect: 60, total: 100 }
      };

      const diffWithoutWeak = calculator.calculateChallengeDifficulty('KM', unlockedChars);
      const diffWithWeak = calculator.calculateChallengeDifficulty('KMR', unlockedChars);

      // Presence of weak char should reduce difficulty
      expect(diffWithWeak).toBeLessThanOrEqual(diffWithoutWeak);
    });

    it('should apply new character grace period', () => {
      const unlockedChars = new Set(['K', 'M']);
      const normalDiff = calculator.calculateChallengeDifficulty('KM', unlockedChars, 999);
      const graceDiff = calculator.calculateChallengeDifficulty('KM', unlockedChars, 0);

      // Grace period should reduce difficulty
      expect(graceDiff).toBeLessThan(normalDiff);
    });

    it('should consider morse complexity in difficulty', () => {
      const unlockedChars = new Set(['E', 'T', 'A', 'Z', 'Q', '0']);

      // E(.), T(-), A(.-) are simple
      const simpleDiff = calculator.calculateChallengeDifficulty('ETAT', unlockedChars);

      // Z(--..), Q(--.-), 0(-----) are complex
      const complexDiff = calculator.calculateChallengeDifficulty('ZQ0', unlockedChars);

      // Complex morse should be harder
      expect(complexDiff).toBeGreaterThanOrEqual(simpleDiff);
    });

    it('should return difficulty within valid range', () => {
      const unlockedChars = new Set(['K', 'M', 'R', 'S']);
      const diff = calculator.calculateChallengeDifficulty('KMRS KM RS', unlockedChars);

      expect(diff).toBeGreaterThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MIN);
      expect(diff).toBeLessThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MAX);
    });
  });

  describe('Recommended Difficulty', () => {
    it('should recommend higher difficulty for excellent performance', () => {
      const currentDiff = 5;
      const recommended = calculator.getRecommendedDifficulty(currentDiff, 90);

      expect(recommended).toBeGreaterThan(currentDiff);
    });

    it('should recommend lower difficulty for poor performance', () => {
      const currentDiff = 5;
      const recommended = calculator.getRecommendedDifficulty(currentDiff, 50);

      expect(recommended).toBeLessThan(currentDiff);
    });

    it('should maintain difficulty for average performance', () => {
      const currentDiff = 5;
      const recommended = calculator.getRecommendedDifficulty(currentDiff, 70);

      // Should be close to current (within range)
      expect(Math.abs(recommended - currentDiff)).toBeLessThan(1.5);
    });

    it('should not exceed maximum difficulty', () => {
      const currentDiff = 9;
      const recommended = calculator.getRecommendedDifficulty(currentDiff, 95);

      expect(recommended).toBeLessThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MAX);
    });

    it('should not go below minimum difficulty', () => {
      const currentDiff = 2;
      const recommended = calculator.getRecommendedDifficulty(currentDiff, 30);

      expect(recommended).toBeGreaterThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MIN);
    });
  });

  describe('Character Categorization', () => {
    beforeEach(() => {
      tracker.data = {
        'K': { correct: 90, incorrect: 10, total: 100 }, // Strong
        'M': { correct: 85, incorrect: 15, total: 100 }, // Strong
        'R': { correct: 70, incorrect: 30, total: 100 }, // Moderate
        'S': { correct: 40, incorrect: 60, total: 100 }, // Weak
        'U': { correct: 50, incorrect: 50, total: 100 }  // Weak
      };
    });

    it('should categorize characters by accuracy', () => {
      const chars = ['K', 'M', 'R', 'S', 'U'];
      const categorized = calculator.categorizeCharacters(chars);

      expect(categorized.strong).toContain('K');
      expect(categorized.strong).toContain('M');
      expect(categorized.moderate).toContain('R');
      expect(categorized.weak).toContain('S');
      expect(categorized.weak).toContain('U');
    });

    it('should identify strong characters', () => {
      expect(calculator.isCharStrong('K')).toBe(true);
      expect(calculator.isCharStrong('M')).toBe(true);
      expect(calculator.isCharStrong('S')).toBe(false);
    });

    it('should return false for characters with insufficient data', () => {
      tracker.data = {
        'K': { correct: 2, incorrect: 0, total: 2 }
      };

      // Need at least 3 attempts
      expect(calculator.isCharStrong('K')).toBe(false);
    });
  });

  describe('Difficulty Scoring', () => {
    it('should provide feedback for successful challenges', () => {
      const score = calculator.scoreDifficultyMatch('HELLO', 5, true);

      expect(score).toHaveProperty('appropriate');
      expect(score).toHaveProperty('feedback');
      expect(typeof score.appropriate).toBe('boolean');
      expect(typeof score.feedback).toBe('string');
    });

    it('should provide encouraging feedback for hard successful challenges', () => {
      const score = calculator.scoreDifficultyMatch('DIFFICULT', 8, true);

      expect(score.feedback).toContain('challenging');
    });

    it('should suggest easing up after failed hard challenges', () => {
      const score = calculator.scoreDifficultyMatch('DIFFICULT', 8, false);

      expect(score.feedback.toLowerCase()).toMatch(/ease|tough/);
    });
  });

  describe('Difficulty Presets', () => {
    it('should apply difficulty preset configuration', () => {
      const fastCalc = new DifficultyCalculator(tracker, 5); // Very Fast
      const slowCalc = new DifficultyCalculator(tracker, 1); // Very Slow

      // Very Fast should have more generous thresholds
      expect(fastCalc.difficultyConfig.NEW_CHAR_DIFFICULTY_GRACE)
        .toBeGreaterThanOrEqual(slowCalc.difficultyConfig.NEW_CHAR_DIFFICULTY_GRACE);

      expect(fastCalc.difficultyConfig.EXCELLENT_PERFORMANCE_THRESHOLD)
        .toBeGreaterThan(slowCalc.difficultyConfig.EXCELLENT_PERFORMANCE_THRESHOLD);
    });

    it('should apply default preset if invalid preference given', () => {
      const calc = new DifficultyCalculator(tracker, 999);

      // Should still work with defaults
      expect(calc.difficultyConfig).toBeDefined();
      expect(calc.difficultyConfig.NEW_CHAR_DIFFICULTY_GRACE).toBeDefined();
    });
  });

  describe('Grace Period', () => {
    it('should return 0 for newly unlocked character', () => {
      const lessons = calculator.getNewCharacterGracePeriod(5, 6);
      expect(lessons).toBe(0);
    });

    it('should return 999 for no new character', () => {
      const lessons = calculator.getNewCharacterGracePeriod(5, 5);
      expect(lessons).toBe(999);
    });
  });

  describe('Accuracy Tracker Update', () => {
    it('should update accuracy tracker reference', () => {
      const newTracker = new AccuracyTracker();
      newTracker.data = { 'K': { correct: 50, incorrect: 50, total: 100 } };

      calculator.updateAccuracyTracker(newTracker);

      expect(calculator.accuracyTracker).toBe(newTracker);
      expect(calculator.accuracyTracker.data['K']).toBeDefined();
    });
  });
});
