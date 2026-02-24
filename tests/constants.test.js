/**
 * Tests for Constants and Configuration
 */

import { describe, it, expect } from 'vitest';
import { DIFFICULTY_PRESETS } from '../src/constants.js';

describe('Constants - Difficulty Presets', () => {
  describe('Difficulty Preset Structure', () => {
    it('should have 5 difficulty presets', () => {
      expect(Object.keys(DIFFICULTY_PRESETS)).toHaveLength(5);
      expect(DIFFICULTY_PRESETS[1]).toBeDefined();
      expect(DIFFICULTY_PRESETS[2]).toBeDefined();
      expect(DIFFICULTY_PRESETS[3]).toBeDefined();
      expect(DIFFICULTY_PRESETS[4]).toBeDefined();
      expect(DIFFICULTY_PRESETS[5]).toBeDefined();
    });

    it('should have required properties for each preset', () => {
      for (let i = 1; i <= 5; i++) {
        const preset = DIFFICULTY_PRESETS[i];
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('NEW_CHAR_DIFFICULTY_GRACE');
        expect(preset).toHaveProperty('EXCELLENT_PERFORMANCE_THRESHOLD');
        expect(preset).toHaveProperty('POOR_PERFORMANCE_THRESHOLD');
      }
    });

    it('should have unique names for each preset', () => {
      const names = new Set();
      for (let i = 1; i <= 5; i++) {
        names.add(DIFFICULTY_PRESETS[i].name);
      }
      expect(names.size).toBe(5);
    });

    it('should have unique descriptions for each preset', () => {
      const descriptions = new Set();
      for (let i = 1; i <= 5; i++) {
        descriptions.add(DIFFICULTY_PRESETS[i].description);
      }
      expect(descriptions.size).toBe(5);
    });
  });

  describe('Difficulty Preset Names', () => {
    it('should have correct name for Very Slow', () => {
      expect(DIFFICULTY_PRESETS[1].name).toBe('Very Slow');
    });

    it('should have correct name for Slow', () => {
      expect(DIFFICULTY_PRESETS[2].name).toBe('Slow');
    });

    it('should have correct name for Medium', () => {
      expect(DIFFICULTY_PRESETS[3].name).toBe('Medium');
    });

    it('should have correct name for Fast', () => {
      expect(DIFFICULTY_PRESETS[4].name).toBe('Fast');
    });

    it('should have correct name for Very Fast', () => {
      expect(DIFFICULTY_PRESETS[5].name).toBe('Very Fast');
    });
  });

  describe('Difficulty Preset Descriptions', () => {
    it('should have description for Very Hard mentioning thorough learning', () => {
      expect(DIFFICULTY_PRESETS[1].description).toContain('Slow');
      expect(DIFFICULTY_PRESETS[1].description.length).toBeGreaterThan(20);
    });

    it('should have description for Hard', () => {
      expect(DIFFICULTY_PRESETS[2].description).toContain('progression');
      expect(DIFFICULTY_PRESETS[2].description.length).toBeGreaterThan(20);
    });

    it('should have description for Medium mentioning balance', () => {
      expect(DIFFICULTY_PRESETS[3].description).toContain('Balanced');
      expect(DIFFICULTY_PRESETS[3].description.length).toBeGreaterThan(20);
    });

    it('should have description for Easy', () => {
      expect(DIFFICULTY_PRESETS[4].description).toContain('pace');
      expect(DIFFICULTY_PRESETS[4].description.length).toBeGreaterThan(20);
    });

    it('should have description for Very Easy mentioning fast progression', () => {
      expect(DIFFICULTY_PRESETS[5].description).toContain('Fast');
      expect(DIFFICULTY_PRESETS[5].description.length).toBeGreaterThan(20);
    });
  });

  describe('Difficulty Preset Thresholds', () => {
    it('should have progressively stricter thresholds for harder presets', () => {
      // Excellent performance threshold should increase as difficulty decreases (easier is higher threshold)
      expect(DIFFICULTY_PRESETS[5].EXCELLENT_PERFORMANCE_THRESHOLD).toBeGreaterThan(
        DIFFICULTY_PRESETS[1].EXCELLENT_PERFORMANCE_THRESHOLD
      );

      // Poor performance threshold should be higher for easier presets (faster progression is more forgiving)
      expect(DIFFICULTY_PRESETS[5].POOR_PERFORMANCE_THRESHOLD).toBeGreaterThan(
        DIFFICULTY_PRESETS[1].POOR_PERFORMANCE_THRESHOLD
      );
    });

    it('should have grace period decrease as difficulty increases', () => {
      // Grace period should be higher for easier presets (faster progression gives more grace to new chars)
      expect(DIFFICULTY_PRESETS[5].NEW_CHAR_DIFFICULTY_GRACE).toBeGreaterThanOrEqual(
        DIFFICULTY_PRESETS[1].NEW_CHAR_DIFFICULTY_GRACE
      );
    });

    it('should have valid threshold ranges', () => {
      for (let i = 1; i <= 5; i++) {
        const preset = DIFFICULTY_PRESETS[i];
        expect(preset.EXCELLENT_PERFORMANCE_THRESHOLD).toBeGreaterThan(0);
        expect(preset.EXCELLENT_PERFORMANCE_THRESHOLD).toBeLessThanOrEqual(1);
        expect(preset.POOR_PERFORMANCE_THRESHOLD).toBeGreaterThan(0);
        expect(preset.POOR_PERFORMANCE_THRESHOLD).toBeLessThan(1);
        expect(preset.EXCELLENT_PERFORMANCE_THRESHOLD).toBeGreaterThan(
          preset.POOR_PERFORMANCE_THRESHOLD
        );
      }
    });
  });
});
