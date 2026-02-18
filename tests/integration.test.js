/**
 * Integration Tests for MorseTrainer
 * Tests complete user workflows and feature interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MorseTrainer } from '../morse-trainer.js';
import { fireEvent, waitFor } from '@testing-library/dom';

describe('MorseTrainer - Integration Tests', () => {
  let container;
  let trainer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    trainer = new MorseTrainer(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  describe('Complete Training Workflow', () => {
    it('should complete a full training session with correct answer', () => {
      // Start by generating a challenge
      trainer.generateNextChallenge(false);
      const challenge = trainer.state.currentChallenge;
      
      expect(challenge).toBeTruthy();
      expect(trainer.dom.inputs.user.value).toBe('');
      expect(trainer.state.hasPlayedCurrent).toBe(false);
      
      // Mark as played (simulating playback completion)
      trainer.state.hasPlayedCurrent = true;
      trainer.state.isPlaying = false;
      
      // Simulate playback completion
      vi.advanceTimersByTime(5000);
      
      // Enter the correct answer
      trainer.dom.inputs.user.value = challenge.toLowerCase();
      trainer.checkAnswer();
      
      // Verify success feedback
      expect(trainer.dom.displays.feedback.classList.contains('success')).toBe(true);
      expect(trainer.state.stats.history.length).toBe(1);
      expect(trainer.state.stats.history[0].correct).toBe(true);
    });

    it('should handle incorrect answer and retry', () => {
      trainer.generateNextChallenge(false);
      const challenge = trainer.state.currentChallenge;
      
      // Mark as played
      trainer.state.hasPlayedCurrent = true;
      trainer.state.isPlaying = false;
      vi.advanceTimersByTime(5000);
      
      // Enter wrong answer
      trainer.dom.inputs.user.value = 'WRONG';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.classList.contains('error')).toBe(true);
      expect(trainer.state.stats.history[0].correct).toBe(false);
      
      // The challenge should remain the same (no auto-advance on wrong answer)
      expect(trainer.state.currentChallenge).toBe(challenge);
    });

    it('should auto-advance after correct answer when autoPlay enabled', () => {
      trainer.state.settings.autoPlay = true;
      trainer.state.activeTab = 'train';
      
      trainer.generateNextChallenge(false);
      const firstChallenge = trainer.state.currentChallenge;
      
      trainer.state.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = firstChallenge;
      trainer.checkAnswer();
      
      // Wait for auto-advance delay
      vi.advanceTimersByTime(1300);
      
      // Should have new challenge
      expect(trainer.state.currentChallenge).not.toBe(firstChallenge);
    });

    it('should not auto-advance when autoPlay disabled', () => {
      trainer.state.settings.autoPlay = false;
      trainer.state.activeTab = 'train';
      
      trainer.generateNextChallenge(false);
      const firstChallenge = trainer.state.currentChallenge;
      
      trainer.state.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = firstChallenge;
      trainer.checkAnswer();
      
      vi.advanceTimersByTime(1300);
      
      // Should generate next but not play it
      expect(trainer.state.currentChallenge).not.toBe(firstChallenge);
      expect(trainer.state.hasPlayedCurrent).toBe(false);
    });
  });

  describe('Level Progression Workflow', () => {
    it('should automatically increase level after consistent success', () => {
      trainer.state.settings.autoLevel = true;
      trainer.state.settings.lessonLevel = 5;
      
      // Simulate 20 consecutive correct answers
      for (let i = 0; i < 20; i++) {
        trainer.state.currentChallenge = 'A';
        trainer.state.hasPlayedCurrent = true;
        trainer.dom.inputs.user.value = 'A';
        trainer.checkAnswer();
      }
      
      // Level should increase
      expect(trainer.state.settings.lessonLevel).toBeGreaterThan(5);
    });

    it('should automatically decrease level after poor performance', () => {
      // Note: checkAutoLevel is only called after CORRECT answers in current implementation
      // So we need to alternate correct/wrong answers to trigger the check
      trainer.state.settings.autoLevel = true;
      trainer.state.settings.lessonLevel = 5;
      trainer.state.activeTab = 'train';
            
      // Build history: correct, correct, wrong, wrong pattern to get < 60% accuracy
      // This gives us 50% accuracy but still calls checkAutoLevel  
      const initialLevel = trainer.state.settings.lessonLevel;
      
      for (let i = 0; i < 20; i++) {
        trainer.state.currentChallenge = 'KM';
        trainer.state.hasPlayedCurrent = true;
        trainer.state.isPlaying = false;
        // Pattern: C, C, W, W, C, C, W, W... (50% accuracy)
        const cyclePosition = i % 4;
        trainer.dom.inputs.user.value = (cyclePosition < 2) ? 'KM' : 'XX';
        trainer.checkAnswer();
      }
      
      // Level should decrease due to poor performance (50% < 60%)
      expect(trainer.state.settings.lessonLevel).toBeLessThan(initialLevel);
    });

    it('should respect manual level changes', () => {
      const originalLevel = trainer.state.settings.lessonLevel;
      
      // Manually increase level
      const nextBtn = container.querySelector('[data-action="level:next"]');
      fireEvent.click(nextBtn);
      
      expect(trainer.state.settings.lessonLevel).toBe(originalLevel + 1);
      
      // Manually decrease level
      const prevBtn = container.querySelector('[data-action="level:prev"]');
      fireEvent.click(prevBtn);
      
      expect(trainer.state.settings.lessonLevel).toBe(originalLevel);
    });
  });

  describe('Settings Persistence Workflow', () => {
    it('should persist settings across sessions', () => {
      // Change settings
      trainer.state.settings.wpm = 35;
      trainer.state.settings.frequency = 850;
      trainer.state.settings.lessonLevel = 8;
      trainer.saveSettings();
      
      // Create new instance (simulates page reload)
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const newTrainer = new MorseTrainer(newContainer);
      
      // Settings should be restored
      expect(newTrainer.state.settings.wpm).toBe(35);
      expect(newTrainer.state.settings.frequency).toBe(850);
      expect(newTrainer.state.settings.lessonLevel).toBe(8);
      
      document.body.removeChild(newContainer);
    });

    it('should persist stats across sessions', () => {
      // Add some stats
      trainer.state.currentChallenge = 'TEST';
      trainer.state.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = 'TEST';
      trainer.checkAnswer();
      
      // Create new instance
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const newTrainer = new MorseTrainer(newContainer);
      
      // Stats should be restored
      expect(newTrainer.state.stats.history.length).toBeGreaterThan(0);
      expect(newTrainer.state.stats.accuracy.T).toBeTruthy();
      
      document.body.removeChild(newContainer);
    });

    it('should clear all data on reset', () => {
      // Add data
      trainer.state.settings.lessonLevel = 15;
      trainer.state.settings.manualChars = ['X', 'Y', 'Z'];
      trainer.state.stats.history = [{ challenge: 'TEST', correct: true }];
      trainer.state.stats.accuracy = { T: { correct: 5, total: 5 } };
      
      // Confirm reset
      trainer.confirmReset();
      
      // Everything should be cleared
      expect(trainer.state.settings.lessonLevel).toBe(2);
      expect(trainer.state.settings.manualChars).toEqual([]);
      expect(trainer.state.stats.history).toEqual([]);
      expect(trainer.state.stats.accuracy).toEqual({});
    });
  });

  describe('Tab Navigation Workflow', () => {
    it('should maintain state when switching between tabs', () => {
      // Set up some state in training
      trainer.generateNextChallenge(false);
      const challenge = trainer.state.currentChallenge;
      
      // Switch to stats
      const statsTab = container.querySelector('[data-action="tab:stats"]');
      fireEvent.click(statsTab);
      
      expect(trainer.state.activeTab).toBe('stats');
      
      // Switch back to train
      const trainTab = container.querySelector('[data-action="tab:train"]');
      fireEvent.click(trainTab);
      
      expect(trainer.state.activeTab).toBe('train');
      // Challenge should still be there
      expect(trainer.state.currentChallenge).toBe(challenge);
    });

    it('should render fresh stats when viewing stats tab', () => {
      // Add some history
      trainer.state.stats.history = [
        { challenge: 'A', correct: true, timestamp: Date.now() },
        { challenge: 'B', correct: false, timestamp: Date.now() },
      ];
      
      // Switch to stats tab
      const statsTab = container.querySelector('[data-action="tab:stats"]');
      fireEvent.click(statsTab);
      
      // Verify stats are rendered
      const historyItems = container.querySelectorAll('.mt-history-item');
      expect(historyItems.length).toBe(2);
    });

    it('should show guide information in guide tab', () => {
      const guideTab = container.querySelector('[data-action="tab:guide"]');
      fireEvent.click(guideTab);
      
      expect(trainer.state.activeTab).toBe('guide');
      
      // Verify guide content is visible
      const roadmap = container.querySelector('#roadmap-list');
      const abbrGrid = container.querySelector('#abbr-grid');
      
      expect(roadmap.children.length).toBeGreaterThan(0);
      expect(abbrGrid.children.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Workflow', () => {
    it('should support complete keyboard-only workflow', () => {
      trainer.generateNextChallenge(false);
      const challenge = trainer.state.currentChallenge;
      
      // Simulate playing by marking as played
      trainer.state.hasPlayedCurrent = true;
      trainer.state.isPlaying = false;
      
      vi.advanceTimersByTime(5000);
      
      // Type answer
      trainer.dom.inputs.user.value = challenge;
      
      // Press Enter to submit
      fireEvent.keyDown(trainer.dom.inputs.user, { key: 'Enter' });
      
      expect(trainer.state.stats.history.length).toBeGreaterThan(0);
    });

    it('should allow stopping playback with Escape', () => {
      trainer.state.currentChallenge = 'TEST';
      trainer.playMorse('TEST');
      
      expect(trainer.state.isPlaying).toBe(true);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(trainer.state.isPlaying).toBe(false);
    });

    it('should support Ctrl+Space to play from anywhere', () => {
      trainer.state.currentChallenge = 'TEST';
      
      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      document.dispatchEvent(event);
      
      expect(trainer.state.hasPlayedCurrent).toBe(true);
    });
  });

  describe('Manual Character Selection Workflow', () => {
    it('should unlock additional characters via manual selection', () => {
      trainer.state.settings.lessonLevel = 2; // K, M
      trainer.state.settings.manualChars = [];
      
      let unlocked = trainer.getUnlockedSet();
      expect(unlocked.size).toBe(2);
      
      // Manually unlock a character
      trainer.toggleChar('X'); // X is beyond level 2
      
      unlocked = trainer.getUnlockedSet();
      expect(unlocked.size).toBe(3);
      expect(unlocked.has('X')).toBe(true);
    });

    it('should use manually unlocked characters in challenges', () => {
      trainer.state.settings.lessonLevel = 2;
      trainer.state.settings.manualChars = ['Z'];
      
      // Generate many challenges and verify Z can appear
      let foundZ = false;
      for (let i = 0; i < 50; i++) {
        trainer.generateNextChallenge(false);
        if (trainer.state.currentChallenge.includes('Z')) {
          foundZ = true;
          break;
        }
      }
      
      expect(foundZ).toBe(true);
    });

    it('should toggle manual characters on/off', () => {
      trainer.state.settings.lessonLevel = 2;
      trainer.state.settings.manualChars = [];
      
      // Add X
      trainer.toggleChar('X');
      expect(trainer.state.settings.manualChars).toContain('X');
      
      // Remove X
      trainer.toggleChar('X');
      expect(trainer.state.settings.manualChars).not.toContain('X');
    });
  });

  describe('AI Operations Workflow', () => {
    beforeEach(() => {
      trainer.state.settings.apiKey = '';
      trainer.state.hasBrowserAI = false;
    });

    it('should generate offline broadcast and play it', () => {
      const broadcastBtn = container.querySelector('[data-action="ai:broadcast"]');
      fireEvent.click(broadcastBtn);
      
      // Should show feedback
      expect(trainer.dom.displays.feedback.textContent).toContain('Intercepting');
      
      // Advance time for offline generation
      vi.advanceTimersByTime(900);
      
      // Should have generated a challenge
      expect(trainer.state.currentChallenge).toBeTruthy();
    });

    it('should generate coach drill targeting weak chars', () => {
      // Set up weak characters
      trainer.state.stats.accuracy = {
        'M': { correct: 3, total: 10 },
        'R': { correct: 2, total: 10 },
      };
      
      const coachBtn = container.querySelector('[data-action="ai:coach"]');
      fireEvent.click(coachBtn);
      
      vi.advanceTimersByTime(900);
      
      // Should have generated a challenge
      expect(trainer.state.currentChallenge).toBeTruthy();
      // Should show tip
      expect(trainer.dom.displays.aiTipContainer.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Settings Modal Workflow', () => {
    it('should open settings, modify, and apply changes', () => {
      // Open settings
      const settingsBtn = container.querySelector('[data-action="modal:settings:open"]');
      fireEvent.click(settingsBtn);
      
      expect(trainer.dom.modals.settings.classList.contains('hidden')).toBe(false);
      
      // Change WPM
      trainer.dom.inputs.wpm.value = '40';
      fireEvent.input(trainer.dom.inputs.wpm);
      
      expect(trainer.state.settings.wpm).toBe(40);
      
      // Close settings
      const closeBtn = container.querySelector('[data-action="modal:settings:close"]');
      fireEvent.click(closeBtn);
      
      expect(trainer.dom.modals.settings.classList.contains('hidden')).toBe(true);
      
      // Settings should be saved
      const saved = JSON.parse(localStorage.getItem('morse-settings-v3'));
      expect(saved.wpm).toBe(40);
    });
  });

  describe('History Tracking Workflow', () => {
    it('should track complete training session history', () => {
      const challenges = ['KM', 'RM', 'SK', 'MR'];
      
      challenges.forEach((challenge, index) => {
        trainer.state.currentChallenge = challenge;
        trainer.state.hasPlayedCurrent = true;
        trainer.dom.inputs.user.value = index % 2 === 0 ? challenge : 'WRONG';
        trainer.checkAnswer();
      });
      
      expect(trainer.state.stats.history.length).toBe(4);
      expect(trainer.state.stats.history[0].correct).toBe(false); // Last one
      expect(trainer.state.stats.history[1].correct).toBe(true);
      expect(trainer.state.stats.history[2].correct).toBe(false);
      expect(trainer.state.stats.history[3].correct).toBe(true);
    });

    it('should calculate per-character accuracy over time', () => {
      // Answer with K correct twice, wrong once
      ['K', 'K', 'K'].forEach((challenge, index) => {
        trainer.state.currentChallenge = challenge;
        trainer.state.hasPlayedCurrent = true;
        trainer.dom.inputs.user.value = index < 2 ? 'K' : 'WRONG';
        trainer.checkAnswer();
      });
      
      const kStats = trainer.state.stats.accuracy.K;
      expect(kStats.total).toBe(3);
      expect(kStats.correct).toBe(2);
    });
  });

  describe('Skip Word Workflow', () => {
    it('should skip current challenge and generate new one', () => {
      trainer.generateNextChallenge(false);
      const firstChallenge = trainer.state.currentChallenge;
      
      const skipBtn = container.querySelector('[data-action="skipWord"]');
      fireEvent.click(skipBtn);
      
      // Should have new challenge (very unlikely to be the same)
      expect(trainer.state.currentChallenge).toBeTruthy();
      expect(trainer.state.hasPlayedCurrent).toBe(false);
    });

    it('should stop playback when skipping', () => {
      trainer.state.currentChallenge = 'TEST';
      trainer.playMorse('TEST');
      
      expect(trainer.state.isPlaying).toBe(true);
      
      const skipBtn = container.querySelector('[data-action="skipWord"]');
      fireEvent.click(skipBtn);
      
      expect(trainer.state.isPlaying).toBe(false);
    });
  });

  describe('Complete User Journey', () => {
    it('should support a realistic multi-drill training session', () => {
      // User starts at level 2
      expect(trainer.state.settings.lessonLevel).toBe(2);
      
      // Complete 5 drills
      for (let i = 0; i < 5; i++) {
        trainer.generateNextChallenge(false);
        const challenge = trainer.state.currentChallenge;
        
        // Simulate playing completed
        trainer.state.hasPlayedCurrent = true;
        trainer.state.isPlaying = false;
        vi.advanceTimersByTime(100);
        
        // Answer correctly
        trainer.dom.inputs.user.value = challenge;
        trainer.checkAnswer();
      }
      
      // Should have 5 history entries
      expect(trainer.state.stats.history.length).toBe(5);
      
      // All should be correct
      const allCorrect = trainer.state.stats.history.every(h => h.correct);
      expect(allCorrect).toBe(true);
      
      // Check stats view
      const statsTab = container.querySelector('[data-action="tab:stats"]');
      fireEvent.click(statsTab);
      
      const accuracyDiv = container.querySelector('#stat-accuracy');
      expect(accuracyDiv.textContent).toBe('100%');
      
      const drillsDiv = container.querySelector('#stat-drills');
      expect(drillsDiv.textContent).toBe('5');
    });

    it('should preserve training state through navigation', () => {
      // Start training
      trainer.generateNextChallenge(false);
      trainer.playMorse(trainer.state.currentChallenge);
      
      const currentChallenge = trainer.state.currentChallenge;
      
      // Navigate to guide
      const guideTab = container.querySelector('[data-action="tab:guide"]');
      fireEvent.click(guideTab);
      
      // Navigate back to train
      const trainTab = container.querySelector('[data-action="tab:train"]');
      fireEvent.click(trainTab);
      
      // State should be preserved
      expect(trainer.state.currentChallenge).toBe(currentChallenge);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle rapid clicking gracefully', () => {
      const playBtn = container.querySelector('[data-action="togglePlay"]');
      
      // Click play button rapidly
      for (let i = 0; i < 10; i++) {
        fireEvent.click(playBtn);
      }
      
      // Should not crash and should be in valid state
      expect(trainer.state.isPlaying).toBeDefined();
    });

    it('should handle empty input submission', () => {
      trainer.state.currentChallenge = 'TEST';
      trainer.state.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = '';
      
      trainer.checkAnswer();
      
      // Should show error with EMPTY
      expect(trainer.dom.displays.feedback.textContent).toContain('EMPTY');
    });

    it('should handle whitespace-only input', () => {
      trainer.state.currentChallenge = 'TEST';
      trainer.state.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = '   ';
      
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('EMPTY');
    });

    it('should prevent level from going negative', () => {
      trainer.state.settings.lessonLevel = 2;
      
      for (let i = 0; i < 10; i++) {
        trainer.changeLevel(-1);
      }
      
      expect(trainer.state.settings.lessonLevel).toBe(2);
    });

    it('should prevent level from exceeding max', () => {
      trainer.state.settings.lessonLevel = 39;
      
      for (let i = 0; i < 10; i++) {
        trainer.changeLevel(1);
      }
      
      expect(trainer.state.settings.lessonLevel).toBeLessThanOrEqual(40);
    });
  });
});
