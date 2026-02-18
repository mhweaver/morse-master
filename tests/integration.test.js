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
      const challenge = trainer.currentChallenge;
      
      expect(challenge).toBeTruthy();
      expect(trainer.dom.inputs.user.value).toBe('');
      expect(trainer.hasPlayedCurrent).toBe(false);
      
      // Mark as played (simulating playback completion)
      trainer.hasPlayedCurrent = true;
      trainer.audioSynthesizer.isPlaying = false;
      
      // Simulate playback completion
      vi.advanceTimersByTime(5000);
      
      // Enter the correct answer
      trainer.dom.inputs.user.value = challenge.toLowerCase();
      trainer.checkAnswer();
      
      // Verify success feedback
      expect(trainer.dom.displays.feedback.classList.contains('success')).toBe(true);
      expect(trainer.stateManager.stats.history.length).toBe(1);
      expect(trainer.stateManager.stats.history[0].correct).toBe(true);
    });

    it('should handle incorrect answer and retry', () => {
      trainer.generateNextChallenge(false);
      const challenge = trainer.currentChallenge;
      
      // Mark as played
      trainer.hasPlayedCurrent = true;
      trainer.audioSynthesizer.isPlaying = false;
      vi.advanceTimersByTime(5000);
      
      // Enter wrong answer
      trainer.dom.inputs.user.value = 'WRONG';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.classList.contains('error')).toBe(true);
      expect(trainer.stateManager.stats.history[0].correct).toBe(false);
      
      // The challenge should remain the same (no auto-advance on wrong answer)
      expect(trainer.currentChallenge).toBe(challenge);
    });

    it('should auto-advance after correct answer when autoPlay enabled', () => {
      trainer.stateManager.settings.autoPlay = true;
      trainer.activeTab = 'train';
      
      trainer.generateNextChallenge(false);
      const firstChallenge = trainer.currentChallenge;
      
      trainer.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = firstChallenge;
      trainer.checkAnswer();
      
      // Wait for auto-advance delay
      vi.advanceTimersByTime(1300);
      
      // Should have new challenge
      expect(trainer.currentChallenge).not.toBe(firstChallenge);
    });

    it('should not auto-advance when autoPlay disabled', () => {
      trainer.stateManager.settings.autoPlay = false;
      trainer.activeTab = 'train';
      
      trainer.generateNextChallenge(false);
      const firstChallenge = trainer.currentChallenge;
      
      trainer.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = firstChallenge;
      trainer.checkAnswer();
      
      vi.advanceTimersByTime(1300);
      
      // Should generate next but not play it
      expect(trainer.currentChallenge).not.toBe(firstChallenge);
      expect(trainer.hasPlayedCurrent).toBe(false);
    });
  });

  describe('Level Progression Workflow', () => {
    it('should automatically increase level after consistent success', () => {
      trainer.stateManager.settings.autoLevel = true;
      trainer.stateManager.settings.lessonLevel = 5;
      
      // Simulate 20 consecutive correct answers
      for (let i = 0; i < 20; i++) {
        trainer.currentChallenge = 'A';
        trainer.hasPlayedCurrent = true;
        trainer.dom.inputs.user.value = 'A';
        trainer.checkAnswer();
      }
      
      // Level should increase
      expect(trainer.stateManager.settings.lessonLevel).toBeGreaterThan(5);
    });

    it('should automatically decrease level after poor performance', () => {
      // Note: checkAutoLevel is only called after CORRECT answers in current implementation
      // So we need to alternate correct/wrong answers to trigger the check
      trainer.stateManager.settings.autoLevel = true;
      trainer.stateManager.settings.lessonLevel = 5;
      trainer.activeTab = 'train';
            
      // Build history: correct, correct, wrong, wrong pattern to get < 60% accuracy
      // This gives us 50% accuracy but still calls checkAutoLevel  
      const initialLevel = trainer.stateManager.settings.lessonLevel;
      
      for (let i = 0; i < 20; i++) {
        trainer.currentChallenge = 'KM';
        trainer.hasPlayedCurrent = true;
        trainer.audioSynthesizer.isPlaying = false;
        // Pattern: C, C, W, W, C, C, W, W... (50% accuracy)
        const cyclePosition = i % 4;
        trainer.dom.inputs.user.value = (cyclePosition < 2) ? 'KM' : 'XX';
        trainer.checkAnswer();
      }
      
      // Level should decrease due to poor performance (50% < 60%)
      expect(trainer.stateManager.settings.lessonLevel).toBeLessThan(initialLevel);
    });

    it('should respect manual level changes', () => {
      const originalLevel = trainer.stateManager.settings.lessonLevel;
      
      // Manually increase level
      const nextBtn = container.querySelector('[data-action="level:next"]');
      fireEvent.click(nextBtn);
      
      expect(trainer.stateManager.settings.lessonLevel).toBe(originalLevel + 1);
      
      // Manually decrease level
      const prevBtn = container.querySelector('[data-action="level:prev"]');
      fireEvent.click(prevBtn);
      
      expect(trainer.stateManager.settings.lessonLevel).toBe(originalLevel);
    });
  });

  describe('Settings Persistence Workflow', () => {
    it('should persist settings across sessions', () => {
      // Change settings
      trainer.stateManager.settings.wpm = 35;
      trainer.stateManager.settings.frequency = 850;
      trainer.stateManager.settings.lessonLevel = 8;
      trainer.stateManager.saveSettings();
      
      // Create new instance (simulates page reload)
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const newTrainer = new MorseTrainer(newContainer);
      
      // Settings should be restored
      expect(newTrainer.stateManager.settings.wpm).toBe(35);
      expect(newTrainer.stateManager.settings.frequency).toBe(850);
      expect(newTrainer.stateManager.settings.lessonLevel).toBe(8);
      
      document.body.removeChild(newContainer);
    });

    it('should persist stats across sessions', () => {
      // Add some stats
      trainer.currentChallenge = 'TEST';
      trainer.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = 'TEST';
      trainer.checkAnswer();
      
      // Create new instance
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const newTrainer = new MorseTrainer(newContainer);
      
      // Stats should be restored
      expect(newTrainer.stateManager.stats.history.length).toBeGreaterThan(0);
      expect(newTrainer.stateManager.stats.accuracy.T).toBeTruthy();
      
      document.body.removeChild(newContainer);
    });

    it('should clear all data on reset', () => {
      // Add data
      trainer.stateManager.settings.lessonLevel = 15;
      trainer.stateManager.settings.manualChars = ['X', 'Y', 'Z'];
      trainer.stateManager.stats.history = [{ challenge: 'TEST', correct: true }];
      trainer.stateManager.stats.accuracy = { T: { correct: 5, total: 5 } };
      
      // Confirm reset
      trainer.confirmReset();
      
      // Everything should be cleared
      expect(trainer.stateManager.settings.lessonLevel).toBe(2);
      expect(trainer.stateManager.settings.manualChars).toEqual([]);
      expect(trainer.stateManager.stats.history).toEqual([]);
      expect(trainer.stateManager.stats.accuracy).toEqual({});
    });
  });

  describe('Tab Navigation Workflow', () => {
    it('should maintain state when switching between tabs', () => {
      // Set up some state in training
      trainer.generateNextChallenge(false);
      const challenge = trainer.currentChallenge;
      
      // Switch to stats
      const statsTab = container.querySelector('[data-action="tab:stats"]');
      fireEvent.click(statsTab);
      
      expect(trainer.activeTab).toBe('stats');
      
      // Switch back to train
      const trainTab = container.querySelector('[data-action="tab:train"]');
      fireEvent.click(trainTab);
      
      expect(trainer.activeTab).toBe('train');
      // Challenge should still be there
      expect(trainer.currentChallenge).toBe(challenge);
    });

    it('should render fresh stats when viewing stats tab', () => {
      // Add some history
      trainer.stateManager.stats.history = [
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
      
      expect(trainer.activeTab).toBe('guide');
      
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
      const challenge = trainer.currentChallenge;
      
      // Simulate playing by marking as played
      trainer.hasPlayedCurrent = true;
      trainer.audioSynthesizer.isPlaying = false;
      
      vi.advanceTimersByTime(5000);
      
      // Type answer
      trainer.dom.inputs.user.value = challenge;
      
      // Press Enter to submit
      fireEvent.keyDown(trainer.dom.inputs.user, { key: 'Enter' });
      
      expect(trainer.stateManager.stats.history.length).toBeGreaterThan(0);
    });

    it('should allow stopping playback with Escape', () => {
      trainer.currentChallenge = 'TEST';
      trainer.playMorse('TEST');
      
      expect(trainer.audioSynthesizer.isPlaying).toBe(true);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });

    it('should support Ctrl+Space to play from anywhere', () => {
      trainer.currentChallenge = 'TEST';
      
      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      document.dispatchEvent(event);
      
      expect(trainer.hasPlayedCurrent).toBe(true);
    });
  });

  describe('Manual Character Selection Workflow', () => {
    it('should unlock additional characters via manual selection', () => {
      trainer.stateManager.settings.lessonLevel = 2; // K, M
      trainer.stateManager.settings.manualChars = [];
      
      let unlocked = trainer.contentGenerator.getUnlockedSet(
        trainer.stateManager.settings.lessonLevel,
        trainer.stateManager.settings.manualChars
      );
      expect(unlocked.size).toBe(2);
      
      // Manually unlock a character
      trainer.toggleChar('X'); // X is beyond level 2
      
      unlocked = trainer.contentGenerator.getUnlockedSet(
        trainer.stateManager.settings.lessonLevel,
        trainer.stateManager.settings.manualChars
      );
      expect(unlocked.size).toBe(3);
      expect(unlocked.has('X')).toBe(true);
    });

    it('should use manually unlocked characters in challenges', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      trainer.stateManager.settings.manualChars = ['Z'];
      
      // Generate many challenges and verify Z can appear
      let foundZ = false;
      for (let i = 0; i < 50; i++) {
        trainer.generateNextChallenge(false);
        if (trainer.currentChallenge.includes('Z')) {
          foundZ = true;
          break;
        }
      }
      
      expect(foundZ).toBe(true);
    });

    it('should toggle manual characters on/off', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      trainer.stateManager.settings.manualChars = [];
      
      // Add X
      trainer.toggleChar('X');
      expect(trainer.stateManager.settings.manualChars).toContain('X');
      
      // Remove X
      trainer.toggleChar('X');
      expect(trainer.stateManager.settings.manualChars).not.toContain('X');
    });
  });

  describe('AI Operations Workflow', () => {
    beforeEach(() => {
      trainer.stateManager.settings.apiKey = '';
      trainer.aiOperations.hasBrowserAI = false;
    });

    it('should generate offline broadcast and play it', () => {
      const broadcastBtn = container.querySelector('[data-action="ai:broadcast"]');
      fireEvent.click(broadcastBtn);
      
      // Should show feedback
      expect(trainer.dom.displays.feedback.textContent).toContain('Intercepting');
      
      // Advance time for offline generation
      vi.advanceTimersByTime(900);
      
      // Should have generated a challenge
      expect(trainer.currentChallenge).toBeTruthy();
    });

    it('should generate coach drill targeting weak chars', () => {
      // Set up weak characters
      trainer.stateManager.stats.accuracy = {
        'M': { correct: 3, total: 10 },
        'R': { correct: 2, total: 10 },
      };
      
      const coachBtn = container.querySelector('[data-action="ai:coach"]');
      fireEvent.click(coachBtn);
      
      vi.advanceTimersByTime(900);
      
      // Should have generated a challenge
      expect(trainer.currentChallenge).toBeTruthy();
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
      
      expect(trainer.stateManager.settings.wpm).toBe(40);
      
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
        trainer.currentChallenge = challenge;
        trainer.hasPlayedCurrent = true;
        trainer.dom.inputs.user.value = index % 2 === 0 ? challenge : 'WRONG';
        trainer.checkAnswer();
      });
      
      expect(trainer.stateManager.stats.history.length).toBe(4);
      expect(trainer.stateManager.stats.history[0].correct).toBe(false); // Last one
      expect(trainer.stateManager.stats.history[1].correct).toBe(true);
      expect(trainer.stateManager.stats.history[2].correct).toBe(false);
      expect(trainer.stateManager.stats.history[3].correct).toBe(true);
    });

    it('should calculate per-character accuracy over time', () => {
      // Answer with K correct twice, wrong once
      ['K', 'K', 'K'].forEach((challenge, index) => {
        trainer.currentChallenge = challenge;
        trainer.hasPlayedCurrent = true;
        trainer.dom.inputs.user.value = index < 2 ? 'K' : 'WRONG';
        trainer.checkAnswer();
      });
      
      const kStats = trainer.stateManager.stats.accuracy.K;
      expect(kStats.total).toBe(3);
      expect(kStats.correct).toBe(2);
    });
  });

  describe('Skip Word Workflow', () => {
    it('should skip current challenge and generate new one', () => {
      trainer.generateNextChallenge(false);
      const firstChallenge = trainer.currentChallenge;
      
      const skipBtn = container.querySelector('[data-action="skipWord"]');
      fireEvent.click(skipBtn);
      
      // Should have new challenge (very unlikely to be the same)
      expect(trainer.currentChallenge).toBeTruthy();
      expect(trainer.hasPlayedCurrent).toBe(false);
    });

    it('should stop playback when skipping', () => {
      trainer.currentChallenge = 'TEST';
      trainer.playMorse('TEST');
      
      expect(trainer.audioSynthesizer.isPlaying).toBe(true);
      
      const skipBtn = container.querySelector('[data-action="skipWord"]');
      fireEvent.click(skipBtn);
      
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });
  });

  describe('Complete User Journey', () => {
    it('should support a realistic multi-drill training session', () => {
      // User starts at level 2
      expect(trainer.stateManager.settings.lessonLevel).toBe(2);
      
      // Complete 5 drills
      for (let i = 0; i < 5; i++) {
        trainer.generateNextChallenge(false);
        const challenge = trainer.currentChallenge;
        
        // Simulate playing completed
        trainer.hasPlayedCurrent = true;
        trainer.audioSynthesizer.isPlaying = false;
        vi.advanceTimersByTime(100);
        
        // Answer correctly
        trainer.dom.inputs.user.value = challenge;
        trainer.checkAnswer();
      }
      
      // Should have 5 history entries
      expect(trainer.stateManager.stats.history.length).toBe(5);
      
      // All should be correct
      const allCorrect = trainer.stateManager.stats.history.every(h => h.correct);
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
      trainer.playMorse(trainer.currentChallenge);
      
      const currentChallenge = trainer.currentChallenge;
      
      // Navigate to guide
      const guideTab = container.querySelector('[data-action="tab:guide"]');
      fireEvent.click(guideTab);
      
      // Navigate back to train
      const trainTab = container.querySelector('[data-action="tab:train"]');
      fireEvent.click(trainTab);
      
      // State should be preserved
      expect(trainer.currentChallenge).toBe(currentChallenge);
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
      expect(trainer.audioSynthesizer.isPlaying).toBeDefined();
    });

    it('should handle empty input submission', () => {
      trainer.currentChallenge = 'TEST';
      trainer.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = '';
      
      trainer.checkAnswer();
      
      // Should show error with EMPTY
      expect(trainer.dom.displays.feedback.textContent).toContain('EMPTY');
    });

    it('should handle whitespace-only input', () => {
      trainer.currentChallenge = 'TEST';
      trainer.hasPlayedCurrent = true;
      trainer.dom.inputs.user.value = '   ';
      
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('EMPTY');
    });

    it('should prevent level from going negative', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      
      for (let i = 0; i < 10; i++) {
        trainer.changeLevel(-1);
      }
      
      expect(trainer.stateManager.settings.lessonLevel).toBe(2);
    });

    it('should prevent level from exceeding max', () => {
      trainer.stateManager.settings.lessonLevel = 39;
      
      for (let i = 0; i < 10; i++) {
        trainer.changeLevel(1);
      }
      
      expect(trainer.stateManager.settings.lessonLevel).toBeLessThanOrEqual(40);
    });
  });
});
