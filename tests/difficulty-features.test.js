/**
 * Tests for Difficulty-Based Challenge Generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentGenerator } from '../src/content-generator.js';
import { AccuracyTracker } from '../src/accuracy-tracker.js';
import { DIFFICULTY } from '../src/constants.js';

describe('Difficulty-Based Challenge Generation', () => {
  let tracker;
  let generator;

  beforeEach(() => {
    tracker = new AccuracyTracker();
    // Set up some accuracy data
    tracker.data = {
      'K': { correct: 90, incorrect: 10, total: 100 },
      'M': { correct: 85, incorrect: 15, total: 100 },
      'R': { correct: 70, incorrect: 30, total: 100 },
      'S': { correct: 40, incorrect: 60, total: 100 },
      'U': { correct: 50, incorrect: 50, total: 100 },
      'A': { correct: 80, incorrect: 20, total: 100 }
    };
    generator = new ContentGenerator(tracker, 3, '');
  });

  describe('generateChallengeForDifficulty', () => {
    it('should generate challenges at specified difficulty level', () => {
      const result = generator.generateChallengeForDifficulty(5, 10, []);
      
      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('meaning');
      expect(result).toHaveProperty('difficulty');
      expect(typeof result.challenge).toBe('string');
      expect(result.challenge.length).toBeGreaterThan(0);
    });

    it('should generate easier challenges for low difficulty', () => {
      const easy1 = generator.generateChallengeForDifficulty(1, 5, []);
      const easy2 = generator.generateChallengeForDifficulty(2, 5, []);
      
      // Easy challenges should be short
      expect(easy1.challenge.replace(/\s/g, '').length).toBeLessThan(5);
      expect(easy2.challenge.replace(/\s/g, '').length).toBeLessThan(5);
    });

    it('should generate harder challenges for high difficulty', () => {
      const hard = generator.generateChallengeForDifficulty(8, 15, []);
      
      // Hard challenges likely to be longer or more complex
      expect(hard.challenge.length).toBeGreaterThan(3);
    });

    it('should clamp difficulty to valid range', () => {
      const tooLow = generator.generateChallengeForDifficulty(-5, 10, []);
      const tooHigh = generator.generateChallengeForDifficulty(50, 10, []);
      
      expect(tooLow.difficulty).toBeGreaterThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MIN);
      expect(tooHigh.difficulty).toBeLessThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MAX);
    });

    it('should use only unlocked characters', () => {
      const lessonLevel = 5; // K, M, R, S, U
      const result = generator.generateChallengeForDifficulty(5, lessonLevel, []);
      const unlockedChars = ['K', 'M', 'R', 'S', 'U'];
      
      const challengeChars = result.challenge.split('').filter(c => c !== ' ');
      challengeChars.forEach(char => {
        expect(unlockedChars.includes(char)).toBe(true);
      });
    });

    it('should generate varied challenges at same difficulty', () => {
      const challenges = new Set();
      
      for (let i = 0; i < 20; i++) {
        const result = generator.generateChallengeForDifficulty(5, 10, []);
        challenges.add(result.challenge);
      }
      
      // Should have some variety
      expect(challenges.size).toBeGreaterThan(5);
    });

    it('should use weak characters in generated challenges', () => {
      // S and U are weak in our test data
      let hasWeakChar = false;
      
      for (let i = 0; i < 20; i++) {
        const result = generator.generateChallengeForDifficulty(5, 6, []);
        if (result.challenge.includes('S') || result.challenge.includes('U')) {
          hasWeakChar = true;
          break;
        }
      }
      
      expect(hasWeakChar).toBe(true);
    });
  });

  describe('generateProgressiveBatch', () => {
    it('should generate a batch of challenges', () => {
      const batch = generator.generateProgressiveBatch(10, 10, [], 3);
      
      expect(Array.isArray(batch)).toBe(true);
      expect(batch.length).toBe(10);
    });

    it('should include challenge metadata in batch', () => {
      const batch = generator.generateProgressiveBatch(5, 10, [], 4);
      
      batch.forEach(item => {
        expect(item).toHaveProperty('challenge');
        expect(item).toHaveProperty('meaning');
        expect(item).toHaveProperty('difficulty');
      });
    });

    it('should start at specified difficulty', () => {
      const startDiff = 3;
      const batch = generator.generateProgressiveBatch(10, 10, [], startDiff);
      
      // First few challenges should be near starting difficulty
      const firstFew = batch.slice(0, 3);
      firstFew.forEach(item => {
        expect(Math.abs(item.difficulty - startDiff)).toBeLessThan(3);
      });
    });

    it('should adapt difficulty based on simulated performance', () => {
      // Set high accuracy to trigger difficulty increase
      tracker.data = {
        'K': { correct: 95, incorrect: 5, total: 100 },
        'M': { correct: 95, incorrect: 5, total: 100 },
        'R': { correct: 95, incorrect: 5, total: 100 }
      };
      
      const batch = generator.generateProgressiveBatch(10, 5, [], 3);
      
      // Later challenges should have higher difficulty on average
      const firstHalf = batch.slice(0, 5).map(b => b.difficulty);
      const secondHalf = batch.slice(5).map(b => b.difficulty);
      
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Second half might be harder (or at least not easier)
      expect(avgSecond).toBeGreaterThanOrEqual(avgFirst - 1);
    });

    it('should generate batch with varied challenges', () => {
      const batch = generator.generateProgressiveBatch(15, 10, [], 5);
      const uniqueChallenges = new Set(batch.map(b => b.challenge));
      
      // Should have variety
      expect(uniqueChallenges.size).toBeGreaterThan(5);
    });
  });

  describe('generateNewCharacterChallenge', () => {
    beforeEach(() => {
      // Reset tracker for new character testing
      tracker.data = {
        'K': { correct: 90, incorrect: 10, total: 100 },
        'M': { correct: 85, incorrect: 15, total: 100 },
        'V': { correct: 0, incorrect: 0, total: 0 } // Brand new
      };
    });

    it('should generate challenge for new character', () => {
      const result = generator.generateNewCharacterChallenge('V', 5, []);
      
      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('meaning');
      expect(result).toHaveProperty('difficulty');
      expect(result).toHaveProperty('focusChar');
      expect(result.focusChar).toBe('V');
    });

    it('should start with isolated character for 0 attempts', () => {
      const result = generator.generateNewCharacterChallenge('V', 5, []);
      
      // With 0 attempts, should get just the character
      expect(result.challenge).toBe('V');
    });

    it('should progress to pairs after initial attempts', () => {
      tracker.data['V'] = { correct: 2, incorrect: 1, total: 3 };
      
      const result = generator.generateNewCharacterChallenge('V', 5, []);
      
      // Should have character repeated or in pairs
      expect(result.challenge.includes('V')).toBe(true);
      expect(result.challenge.length).toBeGreaterThan(1);
      expect(result.challenge.length).toBeLessThan(6);
    });

    it('should integrate with other characters after many attempts', () => {
      // Mark V as weak so it has 3x weighting in generation
      tracker.data['V'] = { correct: 11, incorrect: 4, total: 15 };
      tracker.data['K'] = { correct: 100, incorrect: 0, total: 100 }; // Strong char for contrast
      
      const result = generator.generateNewCharacterChallenge('V', 5, ['V']);
      
      // Should be more complex integration with multiple groups
      expect(result.challenge.split(' ').length).toBeGreaterThanOrEqual(2);
      expect(result.challenge.length).toBeGreaterThanOrEqual(5); // Multiple char groups
    });

    it('should include focus char in meaning', () => {
      const result = generator.generateNewCharacterChallenge('V', 5, []);
      
      expect(result.meaning.includes('V')).toBe(true);
    });

    it('should calculate realistic difficulty', () => {
      const result = generator.generateNewCharacterChallenge('V', 5, []);
      
      expect(result.difficulty).toBeGreaterThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MIN);
      expect(result.difficulty).toBeLessThanOrEqual(DIFFICULTY.DIFFICULTY_SCALE_MAX);
      
      // New character should be easier
      expect(result.difficulty).toBeLessThan(6);
    });
  });

  describe('getDifficultyMetrics', () => {
    it('should return difficulty metrics', () => {
      const metrics = generator.getDifficultyMetrics(10, [], 5);
      
      expect(metrics).toHaveProperty('currentLevel');
      expect(metrics).toHaveProperty('recommended');
      expect(metrics).toHaveProperty('weak');
      expect(metrics).toHaveProperty('moderate');
      expect(metrics).toHaveProperty('strong');
      expect(metrics).toHaveProperty('overallAccuracy');
      expect(metrics).toHaveProperty('unlockedCount');
    });

    it('should identify weak characters', () => {
      const metrics = generator.getDifficultyMetrics(6, [], 5);
      
      // S and U are weak in our test data
      expect(metrics.weak).toContain('S');
      expect(metrics.weak).toContain('U');
    });

    it('should identify strong characters', () => {
      const metrics = generator.getDifficultyMetrics(6, [], 5);
      
      // K is strong in our test data
      expect(metrics.strong).toContain('K');
    });

    it('should provide recommendation', () => {
      const metrics = generator.getDifficultyMetrics(10, [], 5);
      
      expect(typeof metrics.recommended).toBe('number');
      expect(metrics.recommended).toBeGreaterThanOrEqual(1);
      expect(metrics.recommended).toBeLessThanOrEqual(10);
    });

    it('should calculate overall accuracy', () => {
      const metrics = generator.getDifficultyMetrics(10, [], 5);
      
      expect(typeof metrics.overallAccuracy).toBe('number');
      expect(metrics.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.overallAccuracy).toBeLessThanOrEqual(100);
    });

    it('should count unlocked characters', () => {
      const lessonLevel = 10;
      const metrics = generator.getDifficultyMetrics(lessonLevel, [], 5);
      
      expect(metrics.unlockedCount).toBe(lessonLevel);
    });

    it('should include manual characters in count', () => {
      const lessonLevel = 5;
      const manualChars = ['X', 'Y', 'Z'];
      const metrics = generator.getDifficultyMetrics(lessonLevel, manualChars, 5);
      
      expect(metrics.unlockedCount).toBe(lessonLevel + manualChars.length);
    });
  });

  describe('DifficultyCalculator Integration', () => {
    it('should have difficultyCalculator available', () => {
      expect(generator.difficultyCalculator).toBeDefined();
    });

    it('should update difficulty preference', () => {
      generator.updateDifficultyPreference(5); // Very Hard
      
      expect(generator.difficultyCalculator.difficultyConfig).toBeDefined();
      // Config should reflect Very Hard preset
      expect(generator.difficultyCalculator.difficultyConfig.name).toBe('Very Hard');
    });

    it('should use difficulty calculator for challenge generation', () => {
      const result = generator.generateChallengeForDifficulty(6, 10, []);
      
      // The generated difficulty should be calculated by DifficultyCalculator
      expect(typeof result.difficulty).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty unlocked character set gracefully', () => {
      const result = generator.generateChallengeForDifficulty(5, 0, []);
      
      // Should still return a valid structure
      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('difficulty');
    });

    it('should handle very high lesson levels', () => {
      const result = generator.generateChallengeForDifficulty(5, 40, []);
      
      expect(result.challenge.length).toBeGreaterThan(0);
    });

    it('should handle batch size of 1', () => {
      const batch = generator.generateProgressiveBatch(1, 10, [], 5);
      
      expect(batch.length).toBe(1);
      expect(batch[0]).toHaveProperty('challenge');
    });

    it('should handle large batch sizes', () => {
      const batch = generator.generateProgressiveBatch(50, 10, [], 5);
      
      expect(batch.length).toBe(50);
    });

    it('should handle new character that does not exist in tracker', () => {
      const result = generator.generateNewCharacterChallenge('Z', 15, []);
      
      // Should still generate a challenge
      expect(result.challenge).toBeDefined();
      expect(result.challenge.includes('Z')).toBe(true);
    });
  });
});
