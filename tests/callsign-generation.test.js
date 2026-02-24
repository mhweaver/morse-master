/**
 * Tests for Callsign Generation Features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentGenerator, CALLSIGNS } from '../src/content-generator.js';
import { AccuracyTracker } from '../src/accuracy-tracker.js';
import { StateManager } from '../src/state-manager.js';

describe('Callsign Generation', () => {
  let tracker;
  let generator;

  beforeEach(() => {
    tracker = new AccuracyTracker();
    generator = new ContentGenerator(tracker, 3, '');
  });

  describe('CALLSIGNS Array', () => {
    it('should have callsigns array defined', () => {
      expect(CALLSIGNS).toBeDefined();
      expect(Array.isArray(CALLSIGNS)).toBe(true);
    });

    it('should have many callsigns available', () => {
      expect(CALLSIGNS.length).toBeGreaterThan(50);
    });

    it('should contain valid callsign formats', () => {
      const sampleCallsigns = CALLSIGNS.slice(0, 10);
      
      sampleCallsigns.forEach(callsign => {
        expect(typeof callsign).toBe('string');
        expect(callsign.length).toBeGreaterThan(0);
        expect(callsign).toMatch(/^[A-Z0-9]+$/);
      });
    });

    it('should include US callsigns', () => {
      const hasUSCallsign = CALLSIGNS.some(c => c.startsWith('K') || c.startsWith('W') || c.startsWith('N'));
      expect(hasUSCallsign).toBe(true);
    });

    it('should include international callsigns', () => {
      const hasInternational = CALLSIGNS.some(c => 
        c.startsWith('VE') || c.startsWith('G') || c.startsWith('DL')
      );
      expect(hasInternational).toBe(true);
    });
  });

  describe('User Callsign Feature', () => {
    it('should accept user callsign in constructor', () => {
      const userGen = new ContentGenerator(tracker, 3, 'K1ABC');
      expect(userGen.userCallsign).toBe('K1ABC');
    });

    it('should convert user callsign to uppercase', () => {
      const userGen = new ContentGenerator(tracker, 3, 'k1abc');
      expect(userGen.userCallsign).toBe('K1ABC');
    });

    it('should trim user callsign', () => {
      const userGen = new ContentGenerator(tracker, 3, '  W2XYZ  ');
      expect(userGen.userCallsign).toBe('W2XYZ');
    });

    it('should update user callsign', () => {
      generator.updateUserCallsign('n3qe');
      expect(generator.userCallsign).toBe('N3QE');
    });

    it('should include user callsign heavily in filtered pool', () => {
      const userGen = new ContentGenerator(tracker, 3, 'K1ABC');
      // Use level 40 (all characters) or manually unlock needed chars
      const pool = userGen.getFilteredPool(40, []);
      
      // User callsign should appear multiple times
      const k1abcCount = pool.callsigns.filter(c => c === 'K1ABC').length;
      expect(k1abcCount).toBeGreaterThan(5); // Should appear 10 times
    });

    it('should not include user callsign if characters not unlocked', () => {
      // Level 2 only has K and M
      const userGen = new ContentGenerator(tracker, 3, 'W2XYZ');
      const pool = userGen.getFilteredPool(2, []);
      
      // W, X, Y, Z not unlocked, so user callsign should not appear
      const w2xyzCount = pool.callsigns.filter(c => c === 'W2XYZ').length;
      expect(w2xyzCount).toBe(0);
    });
  });

  describe('Callsign Filtering', () => {
    it('should filter callsigns based on unlocked characters', () => {
      const pool = generator.getFilteredPool(5, []); // K, M, R, S, U
      
      expect(pool.callsigns).toBeDefined();
      expect(Array.isArray(pool.callsigns)).toBe(true);
      
      // All callsigns should only use unlocked characters (may be empty at low levels)
      pool.callsigns.forEach(callsign => {
        const chars = callsign.split('');
        chars.forEach(char => {
          expect(['K', 'M', 'R', 'S', 'U'].includes(char)).toBe(true);
        });
      });
    });

    it('should have callsigns available at higher levels', () => {
      const pool = generator.getFilteredPool(40, []); // All characters unlocked
      
      // With all characters unlocked, should have many callsigns
      expect(pool.callsigns.length).toBeGreaterThan(0);
    });
  });

  describe('Callsign in Challenges', () => {
    it('should include callsigns in content pool', () => {
      const pool = generator.getFilteredPool(40, []); // All characters unlocked
      
      expect(pool).toHaveProperty('callsigns');
      expect(pool.callsigns.length).toBeGreaterThan(0);
    });

    it('should generate callsigns as standalone challenges', () => {
      // Generate many challenges and check if callsigns appear
      let hasCallsign = false;
      
      for (let i = 0; i < 100; i++) {
        const { challenge } = generator.generateChallenge(40, []); // All characters
        if (CALLSIGNS.includes(challenge)) {
          hasCallsign = true;
          break;
        }
      }
      
      expect(hasCallsign).toBe(true);
    });

    it('should include callsigns in offline broadcasts', () => {
      let hasCallsign = false;
      
      for (let i = 0; i < 30; i++) {
        const { challenge } = generator.generateOfflineBroadcast(40, []); // All characters
        const words = challenge.split(' ');
        
        if (words.some(word => CALLSIGNS.includes(word))) {
          hasCallsign = true;
          break;
        }
      }
      
      expect(hasCallsign).toBe(true);
    });

    it('should frequently include user callsign in challenges when set', () => {
      const userGen = new ContentGenerator(tracker, 3, 'K1ABC');
      let userCallsignCount = 0;
      const totalChallenges = 200; // Run more challenges for better statistical accuracy
      
      for (let i = 0; i < totalChallenges; i++) {
        const { challenge } = userGen.generateChallenge(40, []); // All characters
        if (challenge.includes('K1ABC')) {
          userCallsignCount++;
        }
      }
      
      // User callsign should appear in at least 3-4% of challenges
      // (With 10x weighting in filtered pool and 5x content type weighting)
      expect(userCallsignCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('State Management Integration', () => {
    it('should save user callsign in settings', () => {
      const stateManager = new StateManager();
      stateManager.settings.userCallsign = 'W1AW';
      stateManager.saveSettings();
      
      const loaded = new StateManager();
      expect(loaded.settings.userCallsign).toBe('W1AW');
    });

    it('should uppercase callsign when updating setting', () => {
      const stateManager = new StateManager();
      const result = stateManager.updateSetting('userCallsign', 'n2abc');
      
      expect(result.valid).toBe(true);
      expect(stateManager.settings.userCallsign).toBe('N2ABC');
    });

    it('should trim whitespace from callsign', () => {
      const stateManager = new StateManager();
      stateManager.updateSetting('userCallsign', '  K3LR  ');
      
      expect(stateManager.settings.userCallsign).toBe('K3LR');
    });
  });

  describe('Callsign Distribution', () => {
    it('should make callsigns appear more frequently than other content', () => {
      const lessonLevel = 40; // All characters unlocked
      const contentTypeCounts = {
        words: 0,
        abbrs: 0,
        qcodes: 0,
        phrases: 0,
        numbers: 0,
        callsigns: 0,
        synthetic: 0
      };
      
      for (let i = 0; i < 100; i++) {
        const { challenge } = generator.generateChallenge(lessonLevel, []);
        const pool = generator.getFilteredPool(lessonLevel, []);
        
        // Determine content type
        if (pool.callsigns.includes(challenge)) {
          contentTypeCounts.callsigns++;
        } else if (pool.words.includes(challenge)) {
          contentTypeCounts.words++;
        } else if (pool.abbrs.some(a => a.code === challenge)) {
          contentTypeCounts.abbrs++;
        } else if (pool.qcodes.some(q => q.code === challenge)) {
          contentTypeCounts.qcodes++;
        } else if (pool.phrases.includes(challenge)) {
          contentTypeCounts.phrases++;
        } else if (pool.numbers.includes(challenge)) {
          contentTypeCounts.numbers++;
        } else {
          contentTypeCounts.synthetic++;
        }
      }
      
      // Callsigns should appear more frequently than individual other content types
      // (though synthetic will be most common due to 30% probability)
      expect(contentTypeCounts.callsigns).toBeGreaterThan(0);
      
      // Callsigns should be significant portion of real content
      const totalRealContent = Object.values(contentTypeCounts).reduce((a, b) => a + b, 0) - contentTypeCounts.synthetic;
      const callsignPercentage = (contentTypeCounts.callsigns / totalRealContent) * 100;
      
      // With 5x weighting, callsigns should be a large percentage
      expect(callsignPercentage).toBeGreaterThan(20);
    });
  });
});
