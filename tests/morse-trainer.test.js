/**
 * Core Functionality Tests for MorseTrainer
 * Tests all business logic, data processing, and audio generation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MorseTrainer } from '../src/morse-trainer.js';

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
      expect(trainer.stateManager.settings).toMatchObject({
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
      expect(trainer.stateManager.stats).toMatchObject({
        history: [],
        accuracy: {},
      });
    });

    it('should initialize manualChars array if not present', () => {
      expect(trainer.stateManager.settings.manualChars).toEqual([]);
    });

    it('should set activeTab to train by default', () => {
      expect(trainer.activeTab).toBe('train');
    });
  });

  describe('Settings Management', () => {
    it('should save settings to localStorage', () => {
      trainer.stateManager.settings.wpm = 25;
      trainer.stateManager.saveSettings();
      
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
      
      expect(newTrainer.stateManager.settings).toMatchObject(customSettings);
      
      document.body.removeChild(newContainer);
    });

    it('should update individual settings', () => {
      trainer.stateManager.updateSetting('wpm', 35);
      expect(trainer.stateManager.settings.wpm).toBe(35);
      
      trainer.stateManager.updateSetting('frequency', 700);
      expect(trainer.stateManager.settings.frequency).toBe(700);
    });

    it('should handle apiKey setting specially (trim whitespace)', () => {
      trainer.stateManager.updateSetting('apiKey', '  test-key  ');
      expect(trainer.stateManager.settings.apiKey).toBe('test-key');
    });
  });

  describe('Stats Management', () => {
    it('should save stats to localStorage', () => {
      trainer.stateManager.stats.history.push({ challenge: 'TEST', correct: true });
      trainer.stateManager.saveStats();
      
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
      
      expect(newTrainer.stateManager.stats.history).toHaveLength(1);
      expect(newTrainer.stateManager.stats.accuracy.A).toEqual({ correct: 5, total: 10 });
      
      document.body.removeChild(newContainer);
    });

    it('should reset all stats and settings on confirmReset', () => {
      trainer.stateManager.stats.history = [{ challenge: 'TEST' }];
      trainer.stateManager.stats.accuracy = { T: { correct: 1, total: 1 } };
      trainer.stateManager.settings.lessonLevel = 10;
      trainer.stateManager.settings.manualChars = ['X', 'Y'];
      
      trainer.confirmReset();
      
      expect(trainer.stateManager.stats.history).toEqual([]);
      expect(trainer.stateManager.stats.accuracy).toEqual({});
      expect(trainer.stateManager.settings.lessonLevel).toBe(2);
      expect(trainer.stateManager.settings.manualChars).toEqual([]);
    });
  });

  describe('Koch Level Management', () => {
    it('should get unlocked character set based on level', () => {
      trainer.stateManager.settings.lessonLevel = 4;
      trainer.stateManager.settings.manualChars = [];
      
      const unlocked = trainer.contentGenerator.getUnlockedSet(
        trainer.stateManager.settings.lessonLevel,
        trainer.stateManager.settings.manualChars
      );
      expect(unlocked.size).toBe(4); // K, M, R, S
      expect(unlocked.has('K')).toBe(true);
      expect(unlocked.has('M')).toBe(true);
      expect(unlocked.has('R')).toBe(true);
      expect(unlocked.has('S')).toBe(true);
    });

    it('should include manual chars in unlocked set', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      trainer.stateManager.settings.manualChars = ['X', 'Y'];
      
      const unlocked = trainer.contentGenerator.getUnlockedSet(
        trainer.stateManager.settings.lessonLevel,
        trainer.stateManager.settings.manualChars
      );
      expect(unlocked.has('X')).toBe(true);
      expect(unlocked.has('Y')).toBe(true);
    });

    it('should increase level when changeLevel is called with positive delta', () => {
      trainer.stateManager.settings.lessonLevel = 5;
      trainer.changeLevel(1);
      expect(trainer.stateManager.settings.lessonLevel).toBe(6);
    });

    it('should decrease level when changeLevel is called with negative delta', () => {
      trainer.stateManager.settings.lessonLevel = 5;
      trainer.changeLevel(-1);
      expect(trainer.stateManager.settings.lessonLevel).toBe(4);
    });

    it('should not go below level 2', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      trainer.changeLevel(-5);
      expect(trainer.stateManager.settings.lessonLevel).toBe(2);
    });

    it('should not exceed maximum Koch sequence length', () => {
      trainer.stateManager.settings.lessonLevel = 40;
      trainer.changeLevel(10);
      expect(trainer.stateManager.settings.lessonLevel).toBeLessThanOrEqual(40);
    });

    it('should toggle manual character on/off', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      trainer.stateManager.settings.manualChars = [];
      
      // Toggle on
      trainer.toggleChar('X');
      expect(trainer.stateManager.settings.manualChars).toContain('X');
      
      // Toggle off
      trainer.toggleChar('X');
      expect(trainer.stateManager.settings.manualChars).not.toContain('X');
    });

    it('should not toggle characters within current level', () => {
      trainer.stateManager.settings.lessonLevel = 5;
      trainer.stateManager.settings.manualChars = [];
      
      // 'K' is index 0, within level 5
      trainer.toggleChar('K');
      expect(trainer.stateManager.settings.manualChars).not.toContain('K');
    });
  });

  describe('Challenge Generation', () => {
    beforeEach(() => {
      trainer.stateManager.settings.lessonLevel = 10;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate a challenge', () => {
      trainer.generateNextChallenge(false);
      expect(trainer.currentChallenge).toBeTruthy();
      expect(trainer.currentChallenge.length).toBeGreaterThan(0);
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
      trainer.stateManager.settings.lessonLevel = 3; // K, M, R
      trainer.stateManager.settings.manualChars = [];
      
      // Generate many challenges to test randomness
      for (let i = 0; i < 20; i++) {
        trainer.generateNextChallenge(false);
        const chars = trainer.currentChallenge.replace(/\s/g, '').split('');
        chars.forEach(char => {
          expect(['K', 'M', 'R']).toContain(char);
        });
      }
    });

    it('should set hasPlayedCurrent to false on new challenge', () => {
      trainer.hasPlayedCurrent = true;
      trainer.generateNextChallenge(false);
      expect(trainer.hasPlayedCurrent).toBe(false);
    });

    it('should get filtered pool based on unlocked characters', () => {
      trainer.stateManager.settings.lessonLevel = 10;
      const pool = trainer.contentGenerator.getFilteredPool(
        trainer.stateManager.settings.lessonLevel,
        trainer.stateManager.settings.manualChars
      );
      
      expect(pool).toHaveProperty('words');
      expect(pool).toHaveProperty('abbrs');
      expect(pool).toHaveProperty('qcodes');
      expect(pool).toHaveProperty('phrases');
      expect(Array.isArray(pool.words)).toBe(true);
    });
  });

  describe('Answer Checking', () => {
    beforeEach(() => {
      trainer.currentChallenge = 'TEST';
      trainer.hasPlayedCurrent = true;
      trainer.audioSynthesizer.isPlaying = false;
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
      expect(trainer.stateManager.stats.accuracy.T).toMatchObject({ correct: 2, total: 2 });
      expect(trainer.stateManager.stats.accuracy.E).toMatchObject({ correct: 1, total: 1 });
      expect(trainer.stateManager.stats.accuracy.S).toMatchObject({ correct: 1, total: 1 });
    });

    it('should add to history on answer check', () => {
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.stateManager.stats.history).toHaveLength(1);
      expect(trainer.stateManager.stats.history[0]).toMatchObject({
        challenge: 'TEST',
        input: 'TEST',
        correct: true,
      });
    });

    it('should limit history to 100 entries', () => {
      // Fill history with 100 entries
      trainer.stateManager.stats.history = new Array(100).fill({ challenge: 'OLD', correct: true });
      
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.stateManager.stats.history).toHaveLength(100);
      expect(trainer.stateManager.stats.history[0].challenge).toBe('TEST');
      expect(trainer.stateManager.stats.history[99].challenge).toBe('OLD');
    });

    it('should not check answer if challenge not played yet', () => {
      trainer.hasPlayedCurrent = false;
      const historyLength = trainer.stateManager.stats.history.length;
      
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.stateManager.stats.history.length).toBe(historyLength);
    });

    it('should not check answer while playing', () => {
      trainer.audioSynthesizer.isPlaying = true;
      const historyLength = trainer.stateManager.stats.history.length;
      
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      expect(trainer.stateManager.stats.history.length).toBe(historyLength);
    });

    it('should display meaning if available', () => {
      trainer.currentChallenge = 'QTH';
      trainer.currentMeaning = 'Location';
      trainer.dom.inputs.user.value = 'qth';
      trainer.checkAnswer();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('(Location)');
    });

    it('should generate next challenge on correct answer with autoPlay', () => {
      trainer.stateManager.settings.autoPlay = true;
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      vi.advanceTimersByTime(1300);
      
      expect(trainer.currentChallenge).not.toBe('TEST');
    });
  });

  describe('Auto Level Progression', () => {
    beforeEach(() => {
      trainer.stateManager.settings.autoLevel = true;
      trainer.stateManager.settings.lessonLevel = 5;
    });

    it('should increase level when accuracy >= 90%', () => {
      // Create 20 correct answers
      trainer.stateManager.stats.history = new Array(20).fill(null).map(() => ({
        challenge: 'A',
        correct: true,
        timestamp: Date.now(),
      }));
      
      trainer.checkAutoLevel();
      expect(trainer.stateManager.settings.lessonLevel).toBe(6);
    });

    it('should decrease level when accuracy < 60%', () => {
      // Create 20 answers with <60% accuracy
      trainer.stateManager.stats.history = [
        ...new Array(8).fill({ correct: true }),
        ...new Array(12).fill({ correct: false }),
      ];
      
      trainer.checkAutoLevel();
      expect(trainer.stateManager.settings.lessonLevel).toBe(4);
    });

    it('should not change level if not enough history (< 15 entries)', () => {
      trainer.stateManager.stats.history = new Array(10).fill({ correct: true });
      const originalLevel = trainer.stateManager.settings.lessonLevel;
      
      trainer.checkAutoLevel();
      expect(trainer.stateManager.settings.lessonLevel).toBe(originalLevel);
    });

    it('should not auto level if autoLevel is disabled', () => {
      trainer.stateManager.settings.autoLevel = false;
      trainer.stateManager.stats.history = new Array(20).fill({ correct: true });
      const originalLevel = trainer.stateManager.settings.lessonLevel;
      
      trainer.checkAutoLevel();
      expect(trainer.stateManager.settings.lessonLevel).toBe(originalLevel);
    });

    it('should not decrease below level 2', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      trainer.stateManager.stats.history = new Array(20).fill({ correct: false });
      
      trainer.checkAutoLevel();
      expect(trainer.stateManager.settings.lessonLevel).toBe(2);
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
      expect(trainer.audioSynthesizer.audioCtx).toBeNull();
      trainer.playMorse('A');
      expect(trainer.audioSynthesizer.audioCtx).toBeTruthy();
    });

    it('should set isPlaying to true during playback', () => {
      trainer.playMorse('A');
      expect(trainer.audioSynthesizer.isPlaying).toBe(true);
    });

    it('should set hasPlayedCurrent to true', () => {
      trainer.hasPlayedCurrent = false;
      trainer.playMorse('A');
      expect(trainer.hasPlayedCurrent).toBe(true);
    });

    it('should focus user input on playback', () => {
      const focusSpy = vi.spyOn(trainer.dom.inputs.user, 'focus');
      trainer.playMorse('A');
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should stop current playback if already playing', () => {
      trainer.audioSynthesizer.isPlaying = true;
      trainer.playMorse('A');
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });

    it('should handle empty text gracefully', () => {
      trainer.playMorse('');
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });

    it('should toggle play/stop correctly', () => {
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
      
      trainer.togglePlay();
      expect(trainer.audioSynthesizer.isPlaying).toBe(true);
      
      trainer.togglePlay();
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });
  });

  describe('Playback Control', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      trainer.currentChallenge = 'TEST';
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clear timeout on stopPlayback', () => {
      trainer.playMorse('A');
      const timeout = trainer.playbackTimeout;
      
      trainer.stopPlayback();
      expect(trainer.audioSynthesizer.playbackTimeout).toBeNull();
    });

    it('should disconnect session gain on stopPlayback', () => {
      trainer.playMorse('A');
      const disconnectSpy = vi.spyOn(trainer.audioSynthesizer.sessionGain, 'disconnect');
      
      trainer.stopPlayback();
      vi.advanceTimersByTime(100);
      
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should set isPlaying to false after stopPlayback', () => {
      trainer.playMorse('A');
      trainer.stopPlayback();
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });

    it('should invoke completion callback when audio finishes', () => {
      const completionSpy = vi.fn();
      trainer.audioSynthesizer.play('A', completionSpy);
      
      // Advance timers past the playback duration
      vi.advanceTimersByTime(5000);
      
      expect(completionSpy).toHaveBeenCalled();
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });

    it('should update play button when audio finishes', () => {
      const renderSpy = vi.spyOn(trainer, 'renderPlayButton');
      trainer.playMorse('A');
      
      // Verify button starts as stop button (isPlaying = true)
      expect(trainer.audioSynthesizer.isPlaying).toBe(true);
      
      // Advance timers past playback completion
      vi.advanceTimersByTime(5000);
      
      // Button should be rendered again at completion
      expect(renderSpy).toHaveBeenCalled();
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });

    it('should reset isPlaying flag after completion timeout', () => {
      trainer.playMorse('A');
      expect(trainer.audioSynthesizer.isPlaying).toBe(true);
      
      // Advance timers to completion
      vi.advanceTimersByTime(5000);
      
      expect(trainer.audioSynthesizer.isPlaying).toBe(false);
    });
  });

  describe('AutoPlay Toggle', () => {
    it('should toggle autoPlay setting', () => {
      trainer.stateManager.settings.autoPlay = false;
      trainer.toggleAutoPlay(true);
      expect(trainer.stateManager.settings.autoPlay).toBe(true);
      
      trainer.toggleAutoPlay(false);
      expect(trainer.stateManager.settings.autoPlay).toBe(false);
    });

    it('should save settings when toggling autoPlay', () => {
      // The debounced save function is now used instead of direct save
      // Check that the setting was updated and will be saved
      const debouncedSaveSpy = vi.spyOn(trainer, '_debouncedSaveSettings');
      trainer.toggleAutoPlay(true);
      expect(trainer.stateManager.settings.autoPlay).toBe(true);
      expect(debouncedSaveSpy).toHaveBeenCalled();
    });
  });

  describe('AI Operations - Offline Mode', () => {
    beforeEach(() => {
      trainer.stateManager.settings.apiKey = '';
      trainer.aiOperations.hasBrowserAI = false;
      trainer.stateManager.settings.lessonLevel = 10;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate offline broadcast with unlocked characters', async () => {
      trainer.generateAIBroadcast();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('Intercepting signal');
      
      vi.advanceTimersByTime(900);
      
      expect(trainer.currentChallenge).toBeTruthy();
    });

    it('should generate coach drill targeting weak characters', async () => {
      // Set up weak characters
      trainer.stateManager.stats.accuracy = {
        'T': { correct: 2, total: 10 },
        'E': { correct: 1, total: 10 },
      };
      
      trainer.generateAICoach();
      
      expect(trainer.dom.displays.feedback.textContent).toContain('Consulting Coach');
      
      vi.advanceTimersByTime(900);
      
      expect(trainer.currentChallenge).toBeTruthy();
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
      const saveSpy = vi.spyOn(trainer.stateManager, 'saveSettings');
      trainer.toggleModal('settings', false);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('Phase 3 & 4 Features', () => {
    describe('Weak Character Tracking (Phase 3.2)', () => {
      it('should initialize sessionMetrics with weakCharsFocused array', () => {
        const stats = trainer.stateManager.stats;
        expect(stats.sessionMetrics).toBeDefined();
        expect(stats.sessionMetrics.weakCharsFocused).toBeDefined();
        expect(Array.isArray(stats.sessionMetrics.weakCharsFocused)).toBe(true);
      });

      it('should track weak characters used in challenges', () => {
        // Set up weak characters in accuracy tracker
        trainer.stateManager.stats.accuracy = {
          'E': { correct: 50, total: 100 },
          'T': { correct: 40, total: 100 },
          'A': { correct: 90, total: 100 }
        };
        
        // Mock generateChallenge to return weak chars
        vi.spyOn(trainer.contentGenerator, 'generateChallenge').mockReturnValue({
          challenge: 'ETE',
          meaning: '',
          weakChars: ['E', 'T']
        });

        trainer.generateNextChallenge(false);

        expect(trainer.stateManager.stats.sessionMetrics.weakCharsFocused).toContain('E');
        expect(trainer.stateManager.stats.sessionMetrics.weakCharsFocused).toContain('T');
      });

      it('should accumulate weak characters across multiple challenges', () => {
        trainer.stateManager.stats.sessionMetrics.weakCharsFocused = ['E'];

        vi.spyOn(trainer.contentGenerator, 'generateChallenge').mockReturnValue({
          challenge: 'TT',
          meaning: '',
          weakChars: ['T']
        });

        trainer.generateNextChallenge(false);

        expect(trainer.stateManager.stats.sessionMetrics.weakCharsFocused).toContain('E');
        expect(trainer.stateManager.stats.sessionMetrics.weakCharsFocused).toContain('T');
      });

      it('should update weak character feedback after 3+ challenges', () => {
        trainer.sessionChallengesCount = 3;
        trainer.stateManager.stats.sessionMetrics.weakCharsFocused = ['E', 'T', 'S'];

        trainer.updateWeakCharacterFeedback();

        expect(trainer.dom.displays.weakCharFeedback.classList.contains('hidden')).toBe(false);
        expect(trainer.dom.displays.weakCharList.textContent).toContain('E');
        expect(trainer.dom.displays.weakCharList.textContent).toContain('T');
        expect(trainer.dom.displays.weakCharList.textContent).toContain('S');
      });

      it('should hide weak character feedback for fewer than 3 challenges', () => {
        trainer.sessionChallengesCount = 2;
        trainer.stateManager.stats.sessionMetrics.weakCharsFocused = ['E'];

        trainer.updateWeakCharacterFeedback();

        expect(trainer.dom.displays.weakCharFeedback.classList.contains('hidden')).toBe(true);
      });
    });

    describe('Session Summary (Phase 4.2)', () => {
      it('should initialize sessionStartAccuracy on new day', () => {
        trainer.stateManager.stats.accuracy = {
          'E': { correct: 50, total: 100 },
          'T': { correct: 40, total: 100 }
        };

        const today = new Date().toISOString().split('T')[0];
        trainer.lastSessionDateIso = '2026-01-01'; // Different day

        trainer.dom.inputs.user.value = 'E';
        trainer.currentChallenge = 'E';
        trainer.hasPlayedCurrent = true;
        trainer.checkAnswer();

        expect(trainer.stateManager.stats.sessionMetrics.sessionStartAccuracy).toBeDefined();
        expect(trainer.stateManager.stats.sessionMetrics.sessionStartAccuracy['E']).toBeCloseTo(0.5);
        expect(trainer.stateManager.stats.sessionMetrics.sessionStartAccuracy['T']).toBeCloseTo(0.4);
      });

      it('should track session challenge count', () => {
        trainer.dom.inputs.user.value = 'E';
        trainer.currentChallenge = 'E';
        trainer.hasPlayedCurrent = true;

        const initialCount = trainer.sessionChallengesCount;
        trainer.checkAnswer();

        expect(trainer.sessionChallengesCount).toBe(initialCount + 1);
        expect(trainer.stateManager.stats.sessionMetrics.challengesInSession).toBe(initialCount + 1);
      });

      it('should reset session metrics on new day', () => {
        trainer.stateManager.stats.sessionMetrics = {
          challengesInSession: 10,
          lastSessionDate: '2026-01-01',
          weakCharsFocused: ['E', 'T'],
          sessionStartAccuracy: { 'E': 0.5 }
        };

        trainer.lastSessionDateIso = '2026-01-01';
        trainer.sessionChallengesCount = 10;

        trainer.dom.inputs.user.value = 'E';
        trainer.currentChallenge = 'E';
        trainer.hasPlayedCurrent = true;
        trainer.checkAnswer();

        expect(trainer.sessionChallengesCount).toBe(1);
        expect(trainer.stateManager.stats.sessionMetrics.weakCharsFocused).toEqual([]);
      });

      it('should hide session summary when no challenges completed', () => {
        trainer.stateManager.stats.sessionMetrics.challengesInSession = 0;
        trainer.renderSessionSummary();

        const sessionCard = trainer.domCache.query('#session-summary-card');
        if (sessionCard) {
          expect(sessionCard.classList.contains('hidden')).toBe(true);
        }
      });

      it('should calculate character improvements correctly', () => {
        trainer.stateManager.stats.sessionMetrics = {
          challengesInSession: 5,
          sessionStartAccuracy: {
            'E': 0.5,
            'T': 0.6
          }
        };

        trainer.stateManager.stats.accuracy = {
          'E': { correct: 60, total: 100 }, // 60% now vs 50% start = +10%
          'T': { correct: 70, total: 100 }  // 70% now vs 60% start = +10%
        };

        trainer.renderSessionSummary();

        const improvementsList = trainer.domCache.query('#session-improvements');
        if (improvementsList) {
          expect(improvementsList.innerHTML).toContain('E');
          expect(improvementsList.innerHTML).toContain('T');
        }
      });
    });

    describe('Difficulty Preset Descriptions (Phase 3.3)', () => {
      it('should return correct difficulty label', () => {
        expect(trainer._getDifficultyLabel(1)).toBe('Very Easy');
        expect(trainer._getDifficultyLabel(2)).toBe('Easy');
        expect(trainer._getDifficultyLabel(3)).toBe('Medium');
        expect(trainer._getDifficultyLabel(4)).toBe('Hard');
        expect(trainer._getDifficultyLabel(5)).toBe('Very Hard');
      });

      it('should return correct difficulty description', () => {
        const description = trainer._getDifficultyDescription(1);
        expect(description).toContain('Gentle learning');
        expect(description).toContain('beginners');
      });

      it('should default to Medium for invalid preset', () => {
        expect(trainer._getDifficultyLabel(99)).toBe('Medium');
      });

      it('should update difficulty description when rendering settings', () => {
        trainer.stateManager.settings.difficultyPreference = 4;
        trainer.renderSettings();

        const descElement = trainer.container.querySelector('#difficulty-description');
        expect(descElement.textContent).toContain('Faster progression');
      });
    });

    describe('Session Metrics Defensive Checks', () => {
      it('should handle missing sessionMetrics gracefully in generateNextChallenge', () => {
        delete trainer.stateManager.stats.sessionMetrics;

        vi.spyOn(trainer.contentGenerator, 'generateChallenge').mockReturnValue({
          challenge: 'E',
          meaning: '',
          weakChars: ['E']
        });

        expect(() => trainer.generateNextChallenge(false)).not.toThrow();
        expect(trainer.stateManager.stats.sessionMetrics).toBeDefined();
      });

      it('should handle missing sessionMetrics gracefully in checkAnswer', () => {
        delete trainer.stateManager.stats.sessionMetrics;

        trainer.dom.inputs.user.value = 'E';
        trainer.currentChallenge = 'E';
        trainer.hasPlayedCurrent = true;

        expect(() => trainer.checkAnswer()).not.toThrow();
        expect(trainer.stateManager.stats.sessionMetrics).toBeDefined();
      });

      it('should handle missing sessionMetrics gracefully in updateWeakCharacterFeedback', () => {
        delete trainer.stateManager.stats.sessionMetrics;

        expect(() => trainer.updateWeakCharacterFeedback()).not.toThrow();
        expect(trainer.stateManager.stats.sessionMetrics).toBeDefined();
      });

      it('should handle missing sessionMetrics gracefully in renderSessionSummary', () => {
        delete trainer.stateManager.stats.sessionMetrics;

        expect(() => trainer.renderSessionSummary()).not.toThrow();
        expect(trainer.stateManager.stats.sessionMetrics).toBeDefined();
      });
    });
  });
});
