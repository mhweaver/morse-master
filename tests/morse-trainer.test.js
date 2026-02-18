/**
 * Core Functionality Tests for MorseTrainer
 * Tests all business logic, data processing, and audio generation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MorseTrainer } from '../morse-trainer.js';

describe('MorseTrainer - Core Functionality', () => {
  let container;
  let trainer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    trainer = new MorseTrainer(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should throw error if no container provided', () => {
      expect(() => new MorseTrainer(null)).toThrow('MorseTrainer: Target element required');
    });

    it('should initialize with default settings', () => {
      expect(trainer.state.settings).toMatchObject({
        wpm: 20,
        farnsworthWpm: 12,
        frequency: 600,
        volume: 0.5,
        lessonLevel: 2,
        autoLevel: true,
        autoPlay: true,
      });
    });

    it('should initialize with empty stats', () => {
      expect(trainer.state.stats).toMatchObject({
        history: [],
        accuracy: {},
      });
    });

    it('should initialize manualChars array if not present', () => {
      expect(trainer.state.settings.manualChars).toEqual([]);
    });

    it('should set activeTab to train by default', () => {
      expect(trainer.state.activeTab).toBe('train');
    });
  });

  describe('Settings Management', () => {
    it('should save settings to localStorage', () => {
      trainer.state.settings.wpm = 25;
      trainer.saveSettings();
      
      const saved = JSON.parse(localStorage.getItem('morse-settings-v3'));
      expect(saved.wpm).toBe(25);
    });

    it('should load settings from localStorage', () => {
      const customSettings = {
        wpm: 30,
        farnsworthWpm: 15,
        frequency: 800,
        volume: 0.7,
        lessonLevel: 5,
        autoLevel: false,
        autoPlay: false,
        apiKey: 'test-key',
        manualChars: ['A', 'B'],
      };
      localStorage.setItem('morse-settings-v3', JSON.stringify(customSettings));
      
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const newTrainer = new MorseTrainer(newContainer);
      
      expect(newTrainer.state.settings).toMatchObject(customSettings);
      
      document.body.removeChild(newContainer);
    });

    it('should update individual settings', () => {
      trainer.updateSetting('wpm', 35);
      expect(trainer.state.settings.wpm).toBe(35);
      
      trainer.updateSetting('frequency', 700);
      expect(trainer.state.settings.frequency).toBe(700);
    });

    it('should handle apiKey setting specially (trim whitespace)', () => {
      trainer.updateSetting('apiKey', '  test-key  ');
      expect(trainer.state.settings.apiKey).toBe('test-key');
    });
  });

  describe('Stats Management', () => {
    it('should save stats to localStorage', () => {
      trainer.state.stats.history.push({ challenge: 'TEST', correct: true });
      trainer.saveStats();
      
      const saved = JSON.parse(localStorage.getItem('morse-stats-v2'));
      expect(saved.history).toHaveLength(1);
      expect(saved.history[0].challenge).toBe('TEST');
    });

    it('should load stats from localStorage', () => {
      const customStats = {
        history: [{ challenge: 'ABC', correct: true, timestamp: 123456 }],
        accuracy: { A: { correct: 5, total: 10 } },
      };
      localStorage.setItem('morse-stats-v2', JSON.stringify(customStats));
      
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const newTrainer = new MorseTrainer(newContainer);
      
      expect(newTrainer.state.stats.history).toHaveLength(1);
      expect(newTrainer.state.stats.accuracy.A).toEqual({ correct: 5, total: 10 });
      
      document.body.removeChild(newContainer);
    });

    it('should reset all stats and settings on confirmReset', () => {
      trainer.state.stats.history = [{ challenge: 'TEST' }];
      trainer.state.stats.accuracy = { T: { correct: 1, total: 1 } };
      trainer.state.settings.lessonLevel = 10;
      trainer.state.settings.manualChars = ['X', 'Y'];
      
      trainer.confirmReset();
      
      expect(trainer.state.stats.history).toEqual([]);
      expect(trainer.state.stats.accuracy).toEqual({});
      expect(trainer.state.settings.lessonLevel).toBe(2);
      expect(trainer.state.settings.manualChars).toEqual([]);
    });
  });

  describe('Koch Level Management', () => {
    it('should get unlocked character set based on level', () => {
      trainer.state.settings.lessonLevel = 4;
      trainer.state.settings.manualChars = [];
      
      const unlocked = trainer.getUnlockedSet();
      expect(unlocked.size).toBe(4); // K, M, R, S
      expect(unlocked.has('K')).toBe(true);
      expect(unlocked.has('M')).toBe(true);
      expect(unlocked.has('R')).toBe(true);
      expect(unlocked.has('S')).toBe(true);
    });

    it('should include manual chars in unlocked set', () => {
      trainer.state.settings.lessonLevel = 2;
      trainer.state.settings.manualChars = ['X', 'Y'];
      
      const unlocked = trainer.getUnlockedSet();
      expect(unlocked.has('X')).toBe(true);
      expect(unlocked.has('Y')).toBe(true);
    });

    it('should increase level when changeLevel is called with positive delta', () => {
      trainer.state.settings.lessonLevel = 5;
      trainer.changeLevel(1);
      expect(trainer.state.settings.lessonLevel).toBe(6);
    });

    it('should decrease level when changeLevel is called with negative delta', () => {
      trainer.state.settings.lessonLevel = 5;
      trainer.changeLevel(-1);
      expect(trainer.state.settings.lessonLevel).toBe(4);
    });

    it('should not go below level 2', () => {
      trainer.state.settings.lessonLevel = 2;
      trainer.changeLevel(-5);
      expect(trainer.state.settings.lessonLevel).toBe(2);
    });

    it('should not exceed maximum Koch sequence length', () => {
      trainer.state.settings.lessonLevel = 40;
      trainer.changeLevel(10);
      expect(trainer.state.settings.lessonLevel).toBeLessThanOrEqual(40);
    });

    it('should toggle manual character on/off', () => {
      trainer.state.settings.lessonLevel = 2;
      trainer.state.settings.manualChars = [];
      
      // Toggle on
      trainer.toggleChar('X');
      expect(trainer.state.settings.manualChars).toContain('X');
      
      // Toggle off
      trainer.toggleChar('X');
      expect(trainer.state.settings.manualChars).not.toContain('X');
    });

    it('should not toggle characters within current level', () => {
      trainer.state.settings.lessonLevel = 5;
      trainer.state.settings.manualChars = [];
      
      // 'K' is index 0, within level 5
      trainer.toggleChar('K');
      expect(trainer.state.settings.manualChars).not.toContain('K');
    });
  });

  describe('Challenge Generation', () => {
    beforeEach(() => {
      trainer.state.settings.lessonLevel = 10;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate a challenge', () => {
      trainer.generateNextChallenge(false);
      expect(trainer.state.currentChallenge).toBeTruthy();
      expect(trainer.state.currentChallenge.length).toBeGreaterThan(0);
    });

    it('should reset user input when generating new challenge', () => {
      trainer.dom.inputs.user.value = 'TEST';
      trainer.generateNextChallenge(false);
      expect(trainer.dom.inputs.user.value).toBe('');
    });

    it('should hide AI tip when generating new challenge', () => {
      trainer.dom.displays.aiTipContainer.classList.remove('hidden');
      trainer.generateNextChallenge(false);
      expect(trainer.dom.displays.aiTipContainer.classList.contains('hidden')).toBe(true);
    });

    it('should only use unlocked characters in synthetic challenges', () => {
      trainer.state.settings.lessonLevel = 3; // K, M, R
      trainer.state.settings.manualChars = [];
      
      // Generate many challenges to test randomness
      for (let i = 0; i < 20; i++) {
        trainer.generateNextChallenge(false);
        const chars = trainer.state.currentChallenge.replace(/\s/g, '').split('');
        chars.forEach(char => {
          expect(['K', 'M', 'R']).toContain(char);
        });
      }
    });

    it('should set hasPlayedCurrent to false on new challenge', () => {
      trainer.state.hasPlayedCurrent = true;
      trainer.generateNextChallenge(false);
      expect(trainer.state.hasPlayedCurrent).toBe(false);
    });

    it('should get filtered pool based on unlocked characters', () => {
      trainer.state.settings.lessonLevel = 10;
      const pool = trainer.getFilteredPool();
      
      expect(pool).toHaveProperty('words');
      expect(pool).toHaveProperty('abbrs');
      expect(pool).toHaveProperty('qcodes');
      expect(pool).toHaveProperty('phrases');
      expect(Array.isArray(pool.words)).toBe(true);
    });
  });

  describe('Answer Checking', () => {
    beforeEach(() => {
      trainer.state.currentChallenge = 'TEST';
      trainer.state.hasPlayedCurrent = true;
      trainer.state.isPlaying = false;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should mark correct answer as correct', () => {
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('Correct!');
      expect(trainer.dom.displays.feedback.classList.contains('success')).toBe(true);
    });

    it('should mark incorrect answer as incorrect', () => {
      trainer.dom.inputs.user.value = 'wrong';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('You: WRONG');
      expect(trainer.dom.displays.feedback.textContent).toContain('Answer: TEST');
      expect(trainer.dom.displays.feedback.classList.contains('error')).toBe(true);
    });

    it('should be case insensitive', () => {
      trainer.dom.inputs.user.value = 'TeSt';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.classList.contains('success')).toBe(true);
    });

    it('should trim whitespace from input', () => {
      trainer.dom.inputs.user.value = '  test  ';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.classList.contains('success')).toBe(true);
    });

    it('should update stats accuracy for each character', () => {
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      // T appears twice in TEST, so it should be correct: 2, total: 2
      expect(trainer.state.stats.accuracy.T).toMatchObject({ correct: 2, total: 2 });
      expect(trainer.state.stats.accuracy.E).toMatchObject({ correct: 1, total: 1 });
      expect(trainer.state.stats.accuracy.S).toMatchObject({ correct: 1, total: 1 });
    });

    it('should add to history on answer check', () => {
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.state.stats.history).toHaveLength(1);
      expect(trainer.state.stats.history[0]).toMatchObject({
        challenge: 'TEST',
        input: 'TEST',
        correct: true,
      });
    });

    it('should limit history to 100 entries', () => {
      // Fill history with 100 entries
      trainer.state.stats.history = new Array(100).fill({ challenge: 'OLD', correct: true });
      
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.state.stats.history).toHaveLength(100);
      expect(trainer.state.stats.history[0].challenge).toBe('TEST');
      expect(trainer.state.stats.history[99].challenge).toBe('OLD');
    });

    it('should not check answer if challenge not played yet', () => {
      trainer.state.hasPlayedCurrent = false;
      const historyLength = trainer.state.stats.history.length;
      
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.state.stats.history.length).toBe(historyLength);
    });

    it('should not check answer while playing', () => {
      trainer.state.isPlaying = true;
      const historyLength = trainer.state.stats.history.length;
      
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.state.stats.history.length).toBe(historyLength);
    });

    it('should display meaning if available', () => {
      trainer.state.currentChallenge = 'QTH';
      trainer.state.currentMeaning = 'Location';
      trainer.dom.inputs.user.value = 'qth';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('(Location)');
    });

    it('should generate next challenge on correct answer with autoPlay', () => {
      trainer.state.settings.autoPlay = true;
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      vi.advanceTimersByTime(1300);
      
      expect(trainer.state.currentChallenge).not.toBe('TEST');
    });
  });

  describe('Auto Level Progression', () => {
    beforeEach(() => {
      trainer.state.settings.autoLevel = true;
      trainer.state.settings.lessonLevel = 5;
    });

    it('should increase level when accuracy >= 90%', () => {
      // Create 20 correct answers
      trainer.state.stats.history = new Array(20).fill(null).map(() => ({
        challenge: 'A',
        correct: true,
        timestamp: Date.now(),
      }));
      
      trainer.checkAutoLevel();
      expect(trainer.state.settings.lessonLevel).toBe(6);
    });

    it('should decrease level when accuracy < 60%', () => {
      // Create 20 answers with <60% accuracy
      trainer.state.stats.history = [
        ...new Array(8).fill({ correct: true }),
        ...new Array(12).fill({ correct: false }),
      ];
      
      trainer.checkAutoLevel();
      expect(trainer.state.settings.lessonLevel).toBe(4);
    });

    it('should not change level if not enough history (< 15 entries)', () => {
      trainer.state.stats.history = new Array(10).fill({ correct: true });
      const originalLevel = trainer.state.settings.lessonLevel;
      
      trainer.checkAutoLevel();
      expect(trainer.state.settings.lessonLevel).toBe(originalLevel);
    });

    it('should not auto level if autoLevel is disabled', () => {
      trainer.state.settings.autoLevel = false;
      trainer.state.stats.history = new Array(20).fill({ correct: true });
      const originalLevel = trainer.state.settings.lessonLevel;
      
      trainer.checkAutoLevel();
      expect(trainer.state.settings.lessonLevel).toBe(originalLevel);
    });

    it('should not decrease below level 2', () => {
      trainer.state.settings.lessonLevel = 2;
      trainer.state.stats.history = new Array(20).fill({ correct: false });
      
      trainer.checkAutoLevel();
      expect(trainer.state.settings.lessonLevel).toBe(2);
    });
  });

  describe('Audio Generation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create audio context on first playback', () => {
      expect(trainer.audioCtx).toBeNull();
      trainer.playMorse('A');
      expect(trainer.audioCtx).toBeTruthy();
    });

    it('should set isPlaying to true during playback', () => {
      trainer.playMorse('A');
      expect(trainer.state.isPlaying).toBe(true);
    });

    it('should set hasPlayedCurrent to true', () => {
      trainer.state.hasPlayedCurrent = false;
      trainer.playMorse('A');
      expect(trainer.state.hasPlayedCurrent).toBe(true);
    });

    it('should focus user input on playback', () => {
      const focusSpy = vi.spyOn(trainer.dom.inputs.user, 'focus');
      trainer.playMorse('A');
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should stop current playback if already playing', () => {
      trainer.state.isPlaying = true;
      trainer.playMorse('A');
      expect(trainer.state.isPlaying).toBe(false);
    });

    it('should handle empty text gracefully', () => {
      trainer.playMorse('');
      expect(trainer.state.isPlaying).toBe(false);
    });

    it('should toggle play/stop correctly', () => {
      expect(trainer.state.isPlaying).toBe(false);
      
      trainer.togglePlay();
      expect(trainer.state.isPlaying).toBe(true);
      
      trainer.togglePlay();
      expect(trainer.state.isPlaying).toBe(false);
    });
  });

  describe('Playback Control', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      trainer.state.currentChallenge = 'TEST';
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clear timeout on stopPlayback', () => {
      trainer.playMorse('A');
      const timeout = trainer.playbackTimeout;
      
      trainer.stopPlayback();
      expect(trainer.playbackTimeout).toBeNull();
    });

    it('should disconnect session gain on stopPlayback', () => {
      trainer.playMorse('A');
      const disconnectSpy = vi.spyOn(trainer.sessionGain, 'disconnect');
      
      trainer.stopPlayback();
      vi.advanceTimersByTime(100);
      
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should set isPlaying to false after stopPlayback', () => {
      trainer.playMorse('A');
      trainer.stopPlayback();
      expect(trainer.state.isPlaying).toBe(false);
    });
  });

  describe('AutoPlay Toggle', () => {
    it('should toggle autoPlay setting', () => {
      trainer.state.settings.autoPlay = false;
      trainer.toggleAutoPlay(true);
      expect(trainer.state.settings.autoPlay).toBe(true);
      
      trainer.toggleAutoPlay(false);
      expect(trainer.state.settings.autoPlay).toBe(false);
    });

    it('should save settings when toggling autoPlay', () => {
      const saveSpy = vi.spyOn(trainer, 'saveSettings');
      trainer.toggleAutoPlay(true);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('AI Operations - Offline Mode', () => {
    beforeEach(() => {
      trainer.state.settings.apiKey = '';
      trainer.state.hasBrowserAI = false;
      trainer.state.settings.lessonLevel = 10;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate offline broadcast with unlocked characters', async () => {
      trainer.generateAIBroadcast();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('Intercepting signal');
      
      vi.advanceTimersByTime(900);
      
      expect(trainer.state.currentChallenge).toBeTruthy();
    });

    it('should generate coach drill targeting weak characters', async () => {
      // Set up weak characters
      trainer.state.stats.accuracy = {
        'T': { correct: 2, total: 10 },
        'E': { correct: 1, total: 10 },
      };
      
      trainer.generateAICoach();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('Consulting Coach');
      
      vi.advanceTimersByTime(900);
      
      expect(trainer.state.currentChallenge).toBeTruthy();
      expect(trainer.dom.displays.aiTipContainer.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Modal Management', () => {
    it('should open modal when toggleModal is called with true', () => {
      trainer.toggleModal('settings', true);
      expect(trainer.dom.modals.settings.classList.contains('hidden')).toBe(false);
    });

    it('should close modal when toggleModal is called with false', () => {
      trainer.toggleModal('settings', false);
      expect(trainer.dom.modals.settings.classList.contains('hidden')).toBe(true);
    });

    it('should save settings when closing settings modal', () => {
      const saveSpy = vi.spyOn(trainer, 'saveSettings');
      trainer.toggleModal('settings', false);
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
