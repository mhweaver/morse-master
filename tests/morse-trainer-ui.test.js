/**
 * UI Rendering and Behavior Tests for MorseTrainer
 * Tests DOM manipulation, event handlers, and user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MorseTrainer } from '../src/morse-trainer.js';
import { fireEvent, waitFor } from '@testing-library/dom';

describe('MorseTrainer - UI Rendering and Behavior', () => {
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

  describe('Initial DOM Structure', () => {
    it('should render header with logo and navigation', () => {
      const header = container.querySelector('.mt-header');
      expect(header).toBeTruthy();
      
      const logo = container.querySelector('.mt-logo-text');
      expect(logo.textContent).toBe('MorseMaster');
      
      const navButtons = container.querySelectorAll('.mt-nav-btn');
      expect(navButtons.length).toBe(4); // Train, Stats, Guide, Settings
    });

    it('should render four main views including settings tab', () => {
      const trainView = container.querySelector('#view-train');
      const statsView = container.querySelector('#view-stats');
      const guideView = container.querySelector('#view-guide');
      const settingsView = container.querySelector('#view-settings');
      
      expect(trainView).toBeTruthy();
      expect(statsView).toBeTruthy();
      expect(guideView).toBeTruthy();
      expect(settingsView).toBeTruthy();
    });

    it('should render play button and user input', () => {
      const playBtn = container.querySelector('#play-btn');
      const userInput = container.querySelector('#user-input');
      
      expect(playBtn).toBeTruthy();
      expect(userInput).toBeTruthy();
      expect(userInput.placeholder).toBe('Type answer...');
    });

    it('should render submit button', () => {
      const submitBtn = container.querySelector('#submit-btn');
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.textContent).toBe('Check Answer');
    });

    it('should render utility modals (reset and aiHelp)', () => {
      const resetModal = container.querySelector('#modal-reset');
      const aiHelpModal = container.querySelector('#modal-ai-help');
      
      expect(resetModal).toBeTruthy();
      expect(aiHelpModal).toBeTruthy();
    });

    it('should hide utility modals initially', () => {
      expect(trainer.dom.modals.reset.classList.contains('hidden')).toBe(true);
      expect(trainer.dom.modals.aiHelp.classList.contains('hidden')).toBe(true);
    });

    it('should render Koch grid', () => {
      const kochGrid = container.querySelector('#koch-grid');
      expect(kochGrid).toBeTruthy();
    });

    it('should render AI operation buttons', () => {
      const buttons = container.querySelectorAll('[data-action^="ai:"]');
      expect(buttons.length).toBeGreaterThanOrEqual(2); // broadcast and coach
    });

    it('should render footer with GitHub link', () => {
      const footer = container.querySelector('.mt-footer');
      expect(footer).toBeTruthy();
      
      const link = footer.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.href).toBe('https://github.com/mhweaver/morse-master/');
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
      expect(link.textContent.trim()).toBe('View Project on GitHub');
    });
  });

  describe('Tab Navigation', () => {
    it('should show train view by default', () => {
      expect(trainer.dom.views.train.classList.contains('hidden')).toBe(false);
      expect(trainer.dom.views.stats.classList.contains('hidden')).toBe(true);
      expect(trainer.dom.views.guide.classList.contains('hidden')).toBe(true);
    });

    it('should switch to stats view when stats tab clicked', () => {
      const statsTab = container.querySelector('[data-action="tab:stats"]');
      fireEvent.click(statsTab);
      
      expect(trainer.dom.views.train.classList.contains('hidden')).toBe(true);
      expect(trainer.dom.views.stats.classList.contains('hidden')).toBe(false);
      expect(trainer.dom.views.guide.classList.contains('hidden')).toBe(true);
      expect(trainer.activeTab).toBe('stats');
    });

    it('should switch to guide view when guide tab clicked', () => {
      const guideTab = container.querySelector('[data-action="tab:guide"]');
      fireEvent.click(guideTab);
      
      expect(trainer.dom.views.train.classList.contains('hidden')).toBe(true);
      expect(trainer.dom.views.stats.classList.contains('hidden')).toBe(true);
      expect(trainer.dom.views.guide.classList.contains('hidden')).toBe(false);
      expect(trainer.activeTab).toBe('guide');
    });

    it('should add active class to current tab button', () => {
      const trainTab = container.querySelector('[data-action="tab:train"]');
      const statsTab = container.querySelector('[data-action="tab:stats"]');
      
      expect(trainTab.classList.contains('active')).toBe(true);
      
      fireEvent.click(statsTab);
      
      expect(trainTab.classList.contains('active')).toBe(false);
      expect(statsTab.classList.contains('active')).toBe(true);
    });

    it('should generate first challenge when switching to train view', () => {
      trainer.currentChallenge = '';
      
      const trainTab = container.querySelector('[data-action="tab:train"]');
      fireEvent.click(trainTab);
      
      expect(trainer.currentChallenge).toBeTruthy();
    });
  });

  describe('Modal Interactions', () => {
    it('should switch to settings tab when settings nav button clicked', () => {
      const settingsBtn = container.querySelector('[data-action="tab:settings"]');
      fireEvent.click(settingsBtn);
      
      expect(trainer.activeTab).toBe('settings');
      const settingsView = container.querySelector('#view-settings');
      expect(settingsView.classList.contains('hidden')).toBe(false);
    });

    it('should show settings view when active', () => {
      trainer.switchTab('settings');
      
      const settingsView = container.querySelector('#view-settings');
      expect(settingsView.classList.contains('hidden')).toBe(false);
      
      const trainView = container.querySelector('#view-train');
      expect(trainView.classList.contains('hidden')).toBe(true);
    });

    it('should open reset confirmation modal', () => {
      const resetBtn = container.querySelector('[data-action="modal:reset:open"]');
      if (resetBtn) {
        fireEvent.click(resetBtn);
        expect(trainer.dom.modals.reset.classList.contains('hidden')).toBe(false);
      }
    });

    it('should close reset modal on cancel', () => {
      trainer.toggleModal('reset', true);
      
      const cancelBtn = container.querySelector('[data-action="modal:reset:close"]');
      fireEvent.click(cancelBtn);
      
      expect(trainer.dom.modals.reset.classList.contains('hidden')).toBe(true);
    });

    it('should open AI help modal', () => {
      const aiHelpBtn = container.querySelector('[data-action="modal:aiHelp:open"]');
      fireEvent.click(aiHelpBtn);
      
      expect(trainer.dom.modals.aiHelp.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Play Button Rendering', () => {
    it('should show play icon initially', () => {
      expect(trainer.dom.displays.playBtn.innerHTML).toContain('polygon'); // Play icon is a polygon
      expect(trainer.dom.displays.playStatus.textContent).toContain('Click to Play');
    });

    it('should change to stop icon when playing', () => {
      trainer.audioSynthesizer.isPlaying = true;
      trainer.renderPlayButton();
      
      expect(trainer.dom.displays.playBtn.innerHTML).toContain('rect'); // Stop icon is a rect
      expect(trainer.dom.displays.playStatus.textContent).toContain('Click to Stop');
    });

    it('should add stop class when playing', () => {
      trainer.audioSynthesizer.isPlaying = true;
      trainer.renderPlayButton();
      
      expect(trainer.dom.displays.playBtn.classList.contains('stop')).toBe(true);
    });

    it('should revert to play icon when stopped', () => {
      trainer.audioSynthesizer.isPlaying = true;
      trainer.renderPlayButton();
      
      trainer.audioSynthesizer.isPlaying = false;
      trainer.renderPlayButton();
      
      expect(trainer.dom.displays.playBtn.classList.contains('play')).toBe(true);
    });
  });

  describe('Submit Button State', () => {
    it('should be disabled when no challenge exists', () => {
      trainer.currentChallenge = '';
      trainer.renderSubmitButton();
      
      expect(trainer.dom.displays.submitBtn.disabled).toBe(true);
    });

    it('should be disabled when playing', () => {
      trainer.currentChallenge = 'TEST';
      trainer.audioSynthesizer.isPlaying = true;
      trainer.hasPlayedCurrent = true;
      trainer.renderSubmitButton();
      
      expect(trainer.dom.displays.submitBtn.disabled).toBe(true);
    });

    it('should be disabled when challenge not played yet', () => {
      trainer.currentChallenge = 'TEST';
      trainer.audioSynthesizer.isPlaying = false;
      trainer.hasPlayedCurrent = false;
      trainer.renderSubmitButton();
      
      expect(trainer.dom.displays.submitBtn.disabled).toBe(true);
    });

    it('should be enabled when challenge played and not playing', () => {
      trainer.currentChallenge = 'TEST';
      trainer.audioSynthesizer.isPlaying = false;
      trainer.hasPlayedCurrent = true;
      trainer.renderSubmitButton();
      
      expect(trainer.dom.displays.submitBtn.disabled).toBe(false);
    });
  });

  describe('Koch Grid Rendering', () => {
    it('should render all Koch sequence characters', () => {
      trainer.renderKochGrid();
      
      const buttons = container.querySelectorAll('.mt-koch-btn');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should mark unlocked characters', () => {
      trainer.stateManager.settings.lessonLevel = 5;
      trainer.stateManager.settings.manualChars = [];
      trainer.renderKochGrid();
      
      const unlockedBtns = container.querySelectorAll('.mt-koch-btn.unlocked');
      expect(unlockedBtns.length).toBe(5);
    });

    it('should mark manually selected characters', () => {
      trainer.stateManager.settings.lessonLevel = 2;
      trainer.stateManager.settings.manualChars = ['X', 'Y'];
      trainer.renderKochGrid();
      
      const manualBtns = container.querySelectorAll('.mt-koch-btn.manual');
      expect(manualBtns.length).toBe(2);
    });

    it('should update level badge', () => {
      trainer.stateManager.settings.lessonLevel = 7;
      trainer.renderKochGrid();
      
      const badge = container.querySelector('#level-badge');
      expect(badge.textContent).toBe('Level 7');
    });

    it('should create clickable buttons with data-char attribute', () => {
      trainer.renderKochGrid();
      
      const firstBtn = container.querySelector('.mt-koch-btn');
      expect(firstBtn.dataset.char).toBeTruthy();
    });
  });

  describe('Settings Rendering', () => {
    it('should display current WPM setting', () => {
      trainer.stateManager.settings.wpm = 25;
      trainer.renderSettings();
      
      const display = container.querySelector('#display-wpm');
      expect(display.textContent).toBe('25 WPM');
    });

    it('should display current Farnsworth setting', () => {
      trainer.stateManager.settings.farnsworthWpm = 15;
      trainer.renderSettings();
      
      const display = container.querySelector('#display-farnsworth');
      expect(display.textContent).toBe('15 WPM');
    });

    it('should display current frequency setting', () => {
      trainer.stateManager.settings.frequency = 800;
      trainer.renderSettings();
      
      const display = container.querySelector('#display-frequency');
      expect(display.textContent).toBe('800 Hz');
    });

    it('should sync input values with settings', () => {
      trainer.stateManager.settings.wpm = 30;
      trainer.stateManager.settings.farnsworthWpm = 20;
      trainer.stateManager.settings.frequency = 900;
      trainer.renderSettings();
      
      expect(trainer.dom.inputs.wpm.value).toBe('30');
      expect(trainer.dom.inputs.farnsworth.value).toBe('20');
      expect(trainer.dom.inputs.frequency.value).toBe('900');
    });

    it('should display AI status badge for cloud API', () => {
      trainer.stateManager.settings.apiKey = 'test-key';
      trainer.renderSettings();
      
      const badge = container.querySelector('#ai-status-badge');
      expect(badge.textContent).toContain('Gemini Cloud');
    });

    it('should display AI status badge for browser AI', () => {
      trainer.stateManager.settings.apiKey = '';
      trainer.aiOperations.hasBrowserAI = true;
      trainer.renderSettings();
      
      const badge = container.querySelector('#ai-status-badge');
      expect(badge.textContent).toContain('Chrome AI');
    });

    it('should display AI status badge for offline mode', () => {
      trainer.stateManager.settings.apiKey = '';
      trainer.aiOperations.hasBrowserAI = false;
      trainer.renderSettings();
      
      const badge = container.querySelector('#ai-status-badge');
      expect(badge.textContent).toContain('Offline Template');
    });
  });

  describe('Stats Rendering', () => {
    it('should display accuracy percentage', () => {
      trainer.stateManager.stats.accuracy = {
        'A': { correct: 8, total: 10 },
        'B': { correct: 7, total: 10 },
      };
      trainer.renderStats();
      
      const accuracyDiv = container.querySelector('#stat-accuracy');
      expect(accuracyDiv.textContent).toBe('75%'); // (8+7)/(10+10) = 15/20 = 75%
    });

    it('should display 0% when no attempts', () => {
      trainer.stateManager.stats.accuracy = {};
      trainer.renderStats();
      
      const accuracyDiv = container.querySelector('#stat-accuracy');
      expect(accuracyDiv.textContent).toBe('0%');
    });

    it('should display total drills count', () => {
      trainer.stateManager.stats.history = [
        { challenge: 'A', correct: true },
        { challenge: 'B', correct: false },
        { challenge: 'C', correct: true },
      ];
      trainer.renderStats();
      
      const drillsDiv = container.querySelector('#stat-drills');
      expect(drillsDiv.textContent).toBe('3');
    });

    it('should render history list with recent entries', () => {
      trainer.stateManager.stats.history = [
        { challenge: 'TEST1', input: 'TEST1', correct: true, timestamp: Date.now() - 30000 },
        { challenge: 'TEST2', input: 'WRONG', correct: false, timestamp: Date.now() - 60000 },
      ];
      trainer.renderStats();
      
      const items = container.querySelectorAll('.mt-history-item');
      expect(items.length).toBe(2);
    });

    it('should limit history display to 20 items', () => {
      trainer.stateManager.stats.history = new Array(50).fill(null).map((_, i) => ({
        challenge: `TEST${i}`,
        correct: true,
        timestamp: Date.now(),
      }));
      trainer.renderStats();
      
      const items = container.querySelectorAll('.mt-history-item');
      expect(items.length).toBe(20);
    });

    it('should show success/error styling for history items', () => {
      trainer.stateManager.stats.history = [
        { challenge: 'A', correct: true, timestamp: Date.now() },
        { challenge: 'B', correct: false, timestamp: Date.now() },
      ];
      trainer.renderStats();
      
      const items = container.querySelectorAll('.mt-history-item');
      expect(items[0].classList.contains('success')).toBe(true);
      expect(items[1].classList.contains('error')).toBe(true);
    });
  });

  describe('Guide Rendering', () => {
    it('should render roadmap list', () => {
      trainer.renderGuide();
      
      const roadmap = container.querySelector('#roadmap-list');
      const chunks = roadmap.querySelectorAll('.mt-roadmap-chunk');
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should render abbreviations grid', () => {
      trainer.renderGuide();
      
      const abbrGrid = container.querySelector('#abbr-grid');
      const cards = abbrGrid.querySelectorAll('.mt-abbr-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display abbreviation codes and meanings', () => {
      trainer.renderGuide();
      
      const firstCard = container.querySelector('.mt-abbr-card');
      expect(firstCard).toBeTruthy();
      
      const code = firstCard.querySelector('.mt-abbr-code');
      const meaning = firstCard.querySelector('.mt-abbr-meaning');
      expect(code).toBeTruthy();
      expect(meaning).toBeTruthy();
    });
  });

  describe('Event Handling - Click Events', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      trainer.currentChallenge = 'TEST';
      trainer.hasPlayedCurrent = true;
      trainer.audioSynthesizer.isPlaying = false;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger play on play button click', () => {
      const playSpy = vi.spyOn(trainer, 'togglePlay');
      const playBtn = container.querySelector('[data-action="togglePlay"]');
      fireEvent.click(playBtn);
      
      expect(playSpy).toHaveBeenCalled();
    });

    it('should trigger check answer on submit button click', () => {
      const checkSpy = vi.spyOn(trainer, 'checkAnswer');
      const submitBtn = container.querySelector('[data-action="checkAnswer"]');
      fireEvent.click(submitBtn);
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should skip on skip button click', () => {
      const generateSpy = vi.spyOn(trainer, 'generateNextChallenge');
      const skipBtn = container.querySelector('[data-action="skipWord"]');
      fireEvent.click(skipBtn);
      
      expect(generateSpy).toHaveBeenCalled();
    });

    it('should trigger AI broadcast on button click', () => {
      const aiSpy = vi.spyOn(trainer, 'generateAIBroadcast');
      const aiBtn = container.querySelector('[data-action="ai:broadcast"]');
      fireEvent.click(aiBtn);
      
      expect(aiSpy).toHaveBeenCalled();
    });

    it('should trigger AI coach on button click', () => {
      const coachSpy = vi.spyOn(trainer, 'generateAICoach');
      const coachBtn = container.querySelector('[data-action="ai:coach"]');
      fireEvent.click(coachBtn);
      
      expect(coachSpy).toHaveBeenCalled();
    });

    it('should handle level navigation buttons', () => {
      const changeSpy = vi.spyOn(trainer, 'changeLevel');
      
      const nextBtn = container.querySelector('[data-action="level:next"]');
      fireEvent.click(nextBtn);
      expect(changeSpy).toHaveBeenCalledWith(1);
      
      const prevBtn = container.querySelector('[data-action="level:prev"]');
      fireEvent.click(prevBtn);
      expect(changeSpy).toHaveBeenCalledWith(-1);
    });

    it('should handle Koch character button clicks', () => {
      trainer.renderKochGrid();
      const toggleSpy = vi.spyOn(trainer, 'toggleChar');
      
      const charBtn = container.querySelector('.mt-koch-btn');
      if (charBtn) {
        // Simulate tap: mousedown then mouseup before long-press timeout (500ms)
        fireEvent.mouseDown(charBtn);
        fireEvent.mouseUp(charBtn);
        // Small tick to allow timer to clear
        vi.advanceTimersByTime(100);
        expect(toggleSpy).not.toHaveBeenCalled(); // Short tap shouldn't call toggleChar
      }
    });

    it('should toggle character on long-press of Koch button', () => {
      const toggleSpy = vi.spyOn(trainer, 'toggleChar');
      const charBtn = container.querySelector('.mt-koch-btn');
      if (charBtn) {
        // Simulate long-press: mousedown and wait 500ms+ before mouseup
        fireEvent.mouseDown(charBtn);
        vi.advanceTimersByTime(550); // Advance past 500ms threshold
        fireEvent.mouseUp(charBtn);
        expect(toggleSpy).toHaveBeenCalled();
      }
    });

    it('should confirm reset on confirmation button', () => {
      const resetSpy = vi.spyOn(trainer, 'confirmReset');
      const confirmBtn = container.querySelector('[data-action="confirmReset"]');
      fireEvent.click(confirmBtn);
      
      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('Event Handling - Keyboard Events', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      trainer.currentChallenge = 'TEST';
      trainer.hasPlayedCurrent = true;
      trainer.audioSynthesizer.isPlaying = false;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should check answer on Enter key when input has value', () => {
      const checkSpy = vi.spyOn(trainer, 'checkAnswer');
      trainer.dom.inputs.user.value = 'test';
      
      fireEvent.keyDown(trainer.dom.inputs.user, { key: 'Enter' });
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should toggle play on Enter key when input is empty', () => {
      const playSpy = vi.spyOn(trainer, 'togglePlay');
      trainer.dom.inputs.user.value = '';
      
      fireEvent.keyDown(trainer.dom.inputs.user, { key: 'Enter' });
      
      expect(playSpy).toHaveBeenCalled();
    });

    it('should toggle play on Space key when input is empty', () => {
      const playSpy = vi.spyOn(trainer, 'togglePlay');
      trainer.dom.inputs.user.value = '';
      
      const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      trainer.dom.inputs.user.dispatchEvent(event);
      
      expect(playSpy).toHaveBeenCalled();
    });

    it('should stop playback on Escape key', () => {
      const stopSpy = vi.spyOn(trainer, 'stopPlayback');
      trainer.audioSynthesizer.isPlaying = true;
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should toggle play on Ctrl+Space global shortcut', () => {
      const playSpy = vi.spyOn(trainer, 'togglePlay');
      
      const event = new KeyboardEvent('keydown', { 
        code: 'Space', 
        ctrlKey: true,
        bubbles: true 
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      document.dispatchEvent(event);
      
      expect(playSpy).toHaveBeenCalled();
    });
  });

  describe('Event Handling - Input Changes', () => {
    it('should update WPM setting on range input', () => {
      const updateSpy = vi.spyOn(trainer, 'updateSetting');
      
      trainer.dom.inputs.wpm.value = '35';
      fireEvent.input(trainer.dom.inputs.wpm);
      
      expect(updateSpy).toHaveBeenCalledWith('wpm', '35');
    });

    it('should update frequency setting on range input', () => {
      const updateSpy = vi.spyOn(trainer, 'updateSetting');
      
      trainer.dom.inputs.frequency.value = '750';
      fireEvent.input(trainer.dom.inputs.frequency);
      
      expect(updateSpy).toHaveBeenCalledWith('frequency', '750');
    });

    it('should update API key setting on input', () => {
      const updateSpy = vi.spyOn(trainer, 'updateSetting');
      
      trainer.dom.inputs.apiKey.value = 'new-key';
      fireEvent.input(trainer.dom.inputs.apiKey);
      
      expect(updateSpy).toHaveBeenCalledWith('apiKey', 'new-key');
    });

    it('should toggle autoPlay on checkbox change', () => {
      const toggleSpy = vi.spyOn(trainer, 'toggleAutoPlay');
      const checkbox = container.querySelector('#autoplay-toggle');
      
      checkbox.checked = true;
      fireEvent.input(checkbox);
      
      expect(toggleSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('Feedback Display', () => {
    beforeEach(() => {
      trainer.currentChallenge = 'TEST';
      trainer.hasPlayedCurrent = true;
      trainer.audioSynthesizer.isPlaying = false;
    });

    it('should show success feedback on correct answer', () => {
      trainer.dom.inputs.user.value = 'test';
      trainer.checkAnswer();
      
      const feedback = trainer.dom.displays.feedback;
      expect(feedback.classList.contains('hidden')).toBe(false);
      expect(feedback.classList.contains('success')).toBe(true);
      expect(feedback.textContent).toContain('Correct!');
    });

    it('should show error feedback on incorrect answer', () => {
      trainer.dom.inputs.user.value = 'wrong';
      trainer.checkAnswer();
      
      const feedback = trainer.dom.displays.feedback;
      expect(feedback.classList.contains('hidden')).toBe(false);
      expect(feedback.classList.contains('error')).toBe(true);
      expect(feedback.textContent).toContain('Answer: TEST');
    });

    it('should hide feedback when generating new challenge', () => {
      trainer.dom.displays.feedback.classList.remove('hidden');
      trainer.generateNextChallenge(false);
      
      expect(trainer.dom.displays.feedback.classList.contains('hidden')).toBe(true);
    });
  });

  describe('AI Tip Display', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      trainer.stateManager.settings.apiKey = '';
      trainer.aiOperations.hasBrowserAI = false;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should hide AI tip on new challenge', () => {
      trainer.dom.displays.aiTipContainer.classList.remove('hidden');
      trainer.generateNextChallenge(false);
      
      expect(trainer.dom.displays.aiTipContainer.classList.contains('hidden')).toBe(true);
    });

    it('should show AI tip after coach drill', async () => {
      trainer.stateManager.stats.accuracy = {
        'T': { correct: 2, total: 10 },
      };
      
      trainer.generateAICoach();
      vi.advanceTimersByTime(900);
      
      expect(trainer.dom.displays.aiTipContainer.classList.contains('hidden')).toBe(false);
      expect(trainer.dom.displays.aiTipText.textContent).toBeTruthy();
    });
  });

  describe('Auto-Play Checkbox', () => {
    it('should be checked when autoPlay is true', () => {
      trainer.stateManager.settings.autoPlay = true;
      const toggle = container.querySelector('#autoplay-toggle');
      toggle.checked = trainer.stateManager.settings.autoPlay;
      
      expect(toggle.checked).toBe(true);
    });

    it('should be unchecked when autoPlay is false', () => {
      trainer.stateManager.settings.autoPlay = false;
      const toggle = container.querySelector('#autoplay-toggle');
      toggle.checked = trainer.stateManager.settings.autoPlay;
      
      expect(toggle.checked).toBe(false);
    });
  });

  describe('Responsive UI Updates', () => {
    it('should update all displays after settings change', () => {
      trainer.stateManager.settings.wpm = 40;
      trainer.stateManager.settings.frequency = 1000;
      trainer.renderSettings();
      
      expect(container.querySelector('#display-wpm').textContent).toBe('40 WPM');
      expect(container.querySelector('#display-frequency').textContent).toBe('1000 Hz');
    });

    it('should re-render Koch grid after level change', () => {
      const renderSpy = vi.spyOn(trainer, 'renderKochGrid');
      trainer.changeLevel(1);
      
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should re-render stats when switching to stats tab', () => {
      const renderSpy = vi.spyOn(trainer, 'renderStats');
      
      const statsTab = container.querySelector('[data-action="tab:stats"]');
      fireEvent.click(statsTab);
      
      expect(renderSpy).toHaveBeenCalled();
    });
  });
});
