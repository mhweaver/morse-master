/**
 * MorseMaster - Modular Trainer Logic
 * Encapsulated ES Module for easy embedding.
 */

import { DOMCache } from './dom-utils.js';
import { ErrorHandler } from './error-handler.js';
import {
  MORSE_LIB,
  KOCH_SEQUENCE,
  ICONS,
  AUTO_LEVEL_CONFIG,
  LEVEL_LIMITS,
  CSS_CLASSES,
  UI_FEEDBACK,
  KOCH_LEVELS,
  UI_RENDERING,
  DEBOUNCE_TIMING,
  CONTENT_GENERATION,
  MODAL_IDENTIFIERS,
  DEFAULT_SETTINGS,
  SETTINGS_RANGES,
  COMMON_ABBR,
  Q_CODES,
  PHRASES,
  DICTIONARY,
  PLAYBACK_DELAYS,
  DEFAULT_STATS
} from './constants.js';
import {
  calculateAccuracyPercentage,
  formatTimeElapsed,
  createDebounced,
  getWeakCharacters
} from './utils.js';
import { AudioSynthesizer } from './audio-synthesizer.js';
import { StateManager } from './state-manager.js';
import { ContentGenerator } from './content-generator.js';
import { AIOperations } from './ai-operations.js';

// --- Class ---
/**
 * MorseTrainer - A comprehensive Morse code training application
 * 
 * Features:
 * - Adaptive difficulty using the Koch method
 * - Farnsworth timing for realistic practice
 * - Audio synthesis with customizable speed and tone
 * - Progress tracking with accuracy statistics
 * - AI-powered drill generation (with fallbacks)
 * 
 * @example
 * const container = document.getElementById('trainer');
 * const trainer = new MorseTrainer(container);
 */
export class MorseTrainer {
    /**
     * Initialize MorseTrainer
     * @param {HTMLElement} containerElement - DOM element to mount the trainer
     * @throws {Error} If container element is not provided
     */
    constructor(containerElement) {
        if (!containerElement) throw new Error("MorseTrainer: Target element required");
        this.container = containerElement;

        // Initialize helper services
        this.stateManager = new StateManager();
        this.audioSynthesizer = new AudioSynthesizer(this.stateManager.settings);
        this.contentGenerator = new ContentGenerator(this.stateManager.stats.accuracy);
        this.aiOperations = new AIOperations(this.stateManager, this.contentGenerator);

        // Initialize application state
        this.currentChallenge = '';
        this.currentMeaning = '';
        this.activeTab = 'train';
        this.hasPlayedCurrent = false;
        this.eventListeners = []; // Track listeners for cleanup
        this.kochLongPressTimers = {}; // Track long-press timers for Koch buttons
        
        // Challenge queue for batch generation
        this.challengeQueue = [];
        this.isCurrentBatchFromNewLevel = false; // Track if batch was generated before level change

        // Create debounced settings save (500ms delay)
        this._debouncedSaveSettings = createDebounced(() => {
            this.stateManager.saveSettings();
        }, DEBOUNCE_TIMING.SETTINGS_SAVE);

        // Render Initial DOM Structure
        this.renderStructure();

        // Initialize DOM Cache for dynamic queries
        this.domCache = new DOMCache(this.container);

        // Cache DOM References
        this.dom = {
            views: {
                train: this.container.querySelector('#view-train'),
                stats: this.container.querySelector('#view-stats'),
                guide: this.container.querySelector('#view-guide')
            },
            inputs: {
                user: this.container.querySelector('#user-input'),
                wpm: this.container.querySelector('#input-wpm'),
                farnsworth: this.container.querySelector('#input-farnsworth'),
                frequency: this.container.querySelector('#input-frequency'),
                apiKey: this.container.querySelector('#input-api-key')
            },
            displays: {
                feedback: this.container.querySelector('#feedback-msg'),
                playBtn: this.container.querySelector('#play-btn'),
                playStatus: this.container.querySelector('#play-status-text'),
                levelBadge: this.container.querySelector('#level-badge'),
                kochGrid: this.container.querySelector('#koch-grid'),
                statsAcc: this.container.querySelector('#stat-accuracy'),
                statsDrills: this.container.querySelector('#stat-drills'),
                historyList: this.container.querySelector('#history-list'),
                abbrGrid: this.container.querySelector('#abbr-grid'),
                roadmap: this.container.querySelector('#roadmap-list'),
                aiTipContainer: this.container.querySelector('#ai-tip-container'),
                aiTipText: this.container.querySelector('#ai-tip-text'),
                submitBtn: this.container.querySelector('#submit-btn')
            },
            modals: {
                settings: this.container.querySelector('#modal-settings'),
                reset: this.container.querySelector('#modal-reset'),
                aiHelp: this.container.querySelector('#modal-ai-help')
            },
            tabs: {
                train: this.container.querySelector('#tab-btn-train'),
                stats: this.container.querySelector('#tab-btn-stats'),
                guide: this.container.querySelector('#tab-btn-guide')
            }
        };

        this.init();
    }

    renderStructure() {
        this.container.innerHTML = `
            <div class="mt-wrapper">
                <header class="mt-header">
                    <div class="mt-header-inner">
                        <div class="mt-logo">
                            <div class="mt-logo-icon">${ICONS.zap}</div>
                            <span class="mt-logo-text">MorseMaster</span>
                        </div>
                        <nav class="mt-nav">
                            <button id="tab-btn-train" class="mt-nav-btn" data-action="tab:train">Train</button>
                            <button id="tab-btn-stats" class="mt-nav-btn" data-action="tab:stats">Stats</button>
                            <button id="tab-btn-guide" class="mt-nav-btn" data-action="tab:guide">Guide</button>
                        </nav>
                        <button class="mt-icon-btn" data-action="modal:settings:open">${ICONS.settings}</button>
                    </div>
                </header>

                <main class="mt-main">
                    <!-- TRAIN VIEW -->
                    <div id="view-train" class="mt-view">
                        <div class="mt-card mt-play-area">
                            <div id="ai-tip-container" class="mt-ai-tip hidden">
                                <strong>Coach's Tip:</strong> <span id="ai-tip-text"></span>
                            </div>
                            <div class="mt-play-controls">
                                <button id="play-btn" class="mt-play-btn" data-action="togglePlay">${ICONS.play}</button>
                                <p id="play-status-text" class="mt-hint">Click to Play (Auto-Focus)</p>
                            </div>
                            <div class="mt-input-wrapper">
                                <input type="text" id="user-input" class="mt-input-large" placeholder="Type answer..." autocomplete="off">
                                <div id="feedback-msg" class="mt-feedback hidden"></div>
                            </div>
                            <button id="submit-btn" class="mt-btn-primary" data-action="checkAnswer">Check Answer</button>
                            <div class="mt-sub-controls">
                                <button class="mt-btn-text" data-action="skipWord">${ICONS.skip} Skip Word</button>
                                <label class="mt-toggle">
                                    <input type="checkbox" id="autoplay-toggle" class="mt-toggle-input" data-action="toggleAutoPlay">
                                    <span class="mt-toggle-slider"></span>
                                    <span class="mt-toggle-label">Auto-Play</span>
                                </label>
                            </div>
                        </div>

                        <!-- AI Ops -->
                        <div class="mt-section">
                            <div class="mt-section-header">
                                <h3>AI Operations</h3>
                                <button class="mt-link-btn" data-action="modal:aiHelp:open">What is this?</button>
                            </div>
                            <div class="mt-grid-2">
                                <button class="mt-card mt-card-action" data-action="ai:broadcast">
                                    <div class="mt-card-icon icon-indigo">${ICONS.ai}</div>
                                    <div>
                                        <h4>Intercept Broadcast</h4>
                                        <p>Generate creative sentences</p>
                                    </div>
                                </button>
                                <button class="mt-card mt-card-action" data-action="ai:coach">
                                    <div class="mt-card-icon icon-emerald">${ICONS.ai}</div>
                                    <div>
                                        <h4>Smart Coach Drill</h4>
                                        <p>Target your weak chars</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- Koch Grid -->
                        <div class="mt-card">
                            <div class="mt-section-header">
                                <h3>Koch Milestones <span id="level-badge" class="mt-badge">Level 2</span></h3>
                            </div>
                            <div id="koch-grid" class="mt-koch-grid"></div>
                            <div class="mt-level-controls">
                                <span>Manual Override</span>
                                <div>
                                    <button class="mt-btn-small" data-action="level:prev">Prev</button>
                                    <button class="mt-btn-small" data-action="level:next">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- STATS VIEW -->
                    <div id="view-stats" class="mt-view hidden">
                        <div class="mt-grid-3">
                            <div class="mt-card">
                                <span class="mt-label">Accuracy</span>
                                <div id="stat-accuracy" class="mt-stat-value">0%</div>
                            </div>
                            <div class="mt-card">
                                <span class="mt-label">Total Drills</span>
                                <div id="stat-drills" class="mt-stat-value">0</div>
                            </div>
                            <div class="mt-card flex-center">
                                <button class="mt-btn-danger" data-action="modal:reset:open">Wipe Progress</button>
                            </div>
                        </div>
                        <div class="mt-card">
                            <h3>Recent Drills</h3>
                            <div id="history-list" class="mt-history-list"></div>
                        </div>
                    </div>

                    <!-- GUIDE VIEW -->
                    <div id="view-guide" class="mt-view hidden">
                        <div class="mt-card">
                            <h2>User Guide</h2>
                            <div class="mt-grid-2">
                                <div>
                                    <h4>The Koch Method</h4>
                                    <p>Learn at full speed. Do not visualize dots/dashes. Listen to the rhythm.</p>
                                </div>
                                <div>
                                    <h4>Farnsworth Timing</h4>
                                    <p>Characters are sent fast, but spaced out to give you thinking time.</p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-card mt-card-dark">
                            <h3>Course Roadmap</h3>
                            <div id="roadmap-list" class="mt-list-spaced"></div>
                        </div>
                        <div class="mt-card">
                            <h3>Common Abbreviations</h3>
                            <div id="abbr-grid" class="mt-grid-3"></div>
                        </div>
                    </div>
                </main>

                <!-- Settings Modal -->
                <div id="modal-settings" class="mt-modal hidden">
                    <div class="mt-modal-content">
                        <div class="mt-modal-header">
                            <h2>Settings</h2>
                            <button class="mt-close-btn" data-action="modal:settings:close">&times;</button>
                        </div>
                        <div class="mt-modal-body">
                            <div class="mt-form-group">
                                <label>Char Speed <span id="display-wpm">${DEFAULT_SETTINGS.wpm} WPM</span></label>
                                <input type="range" id="input-wpm" min="${SETTINGS_RANGES.wpm.min}" max="${SETTINGS_RANGES.wpm.max}" data-action="setting:wpm">
                            </div>
                            <div class="mt-form-group">
                                <label>Effective Speed <span id="display-farnsworth">${DEFAULT_SETTINGS.farnsworthWpm} WPM</span></label>
                                <input type="range" id="input-farnsworth" min="${SETTINGS_RANGES.farnsworthWpm.min}" max="${SETTINGS_RANGES.farnsworthWpm.max}" data-action="setting:farnsworth">
                            </div>
                            <div class="mt-form-group">
                                <label>Tone Frequency <span id="display-frequency">${DEFAULT_SETTINGS.frequency} Hz</span></label>
                                <input type="range" id="input-frequency" min="${SETTINGS_RANGES.frequency.min}" max="${SETTINGS_RANGES.frequency.max}" step="${SETTINGS_RANGES.frequency.step}" data-action="setting:frequency">
                            </div>
                            <div class="mt-form-group border-top">
                                <label>Gemini API Key (Optional)</label>
                                <input type="password" id="input-api-key" class="mt-input" placeholder="Enter key..." data-action="setting:apiKey">
                                <p class="mt-hint">App will use: Gemini Cloud API → Chrome On-Device AI → Offline Template Engine</p>
                                <div id="ai-status-badge" class="mt-badge-large">Checking...</div>
                            </div>
                        </div>
                        <div class="mt-modal-footer">
                            <button class="mt-btn-primary" data-action="modal:settings:close">Apply & Close</button>
                        </div>
                    </div>
                </div>

                <!-- Reset Modal -->
                <div id="modal-reset" class="mt-modal hidden">
                    <div class="mt-modal-content small">
                        <div class="mt-modal-body center">
                            <h2>Reset Progress?</h2>
                            <p>This will wipe all stats and reset your level. Undoable.</p>
                            <div class="mt-btn-group">
                                <button class="mt-btn-secondary" data-action="modal:reset:close">Cancel</button>
                                <button class="mt-btn-danger" data-action="confirmReset">Yes, Reset</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Help Modal -->
                <div id="modal-ai-help" class="mt-modal hidden">
                    <div class="mt-modal-content">
                        <div class="mt-modal-header">
                            <h2>AI Operations</h2>
                            <button class="mt-close-btn" data-action="modal:aiHelp:close">&times;</button>
                        </div>
                        <div class="mt-modal-body">
                            <p><strong>Intercept Broadcast:</strong> Generates creative sentences using only your known characters.</p>
                            <p><strong>Smart Coach:</strong> Analyzes your error history to create custom drills.</p>
                            <div class="mt-info-box">
                                <p><strong>Offline Capable:</strong> If no API Key is provided, the app uses an advanced local template engine or Chrome's built-in AI (if available).</p>
                            </div>
                        </div>
                        <div class="mt-modal-footer">
                            <button class="mt-btn-primary" data-action="modal:aiHelp:close">Got it</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        // Ensure manual chars array exists
        if (!this.stateManager.settings.manualChars) {
            this.stateManager.settings.manualChars = [];
            this.stateManager.saveSettings();
        }

        // Initialize autoplay toggle UI
        const toggle = this.container.querySelector('#autoplay-toggle');
        if (toggle) toggle.checked = this.stateManager.settings.autoPlay;

        // Detect browser AI capabilities
        await this.aiOperations.initializeAI();

        // Set up event handlers and render UI
        this.bindEvents();
        this.renderSettings();
        this.renderGuide();
        this.switchTab('train');
    }

    /**
     * Clean up resources and event listeners
     * @public
     */
    destroy() {
        // Stop any ongoing playback
        this.audioSynthesizer.stop();

        // Remove all tracked event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];

        // Clean up audio context
        this.audioSynthesizer.destroy();

        // Clear DOM references
        this.container.innerHTML = '';
    }

    // --- Core Logic ---
    bindEvents() {
        // Koch button handlers (mousedown/touchstart for long-press detection)
        const kochMouseDownHandler = (e) => {
            const kochBtn = e.target.closest('.mt-koch-btn');
            if (!kochBtn || !kochBtn.dataset.char) return;

            const char = kochBtn.dataset.char;
            const longPressDelay = 500; // 500ms for long-press

            // Clear any previous timer for this character
            if (this.kochLongPressTimers[char]) {
                clearTimeout(this.kochLongPressTimers[char].timer);
            }

            // Set timer for long-press
            this.kochLongPressTimers[char] = {
                timer: setTimeout(() => {
                    // Long-press: toggle character availability
                    this.toggleChar(char);
                    this.kochLongPressTimers[char] = null;
                }, longPressDelay),
                isLongPress: false
            };
        };

        const kochMouseUpHandler = (e) => {
            const kochBtn = e.target.closest('.mt-koch-btn');
            if (!kochBtn || !kochBtn.dataset.char) return;

            const char = kochBtn.dataset.char;
            const longPressState = this.kochLongPressTimers[char];

            if (longPressState && longPressState.timer) {
                // Short tap: play the character sound
                clearTimeout(longPressState.timer);
                this.playKochCharacter(char);
                this.kochLongPressTimers[char] = null;
            }
        };

        const kochMouseLeaveHandler = (e) => {
            const kochBtn = e.target.closest('.mt-koch-btn');
            if (!kochBtn || !kochBtn.dataset.char) return;

            const char = kochBtn.dataset.char;
            if (this.kochLongPressTimers[char]) {
                clearTimeout(this.kochLongPressTimers[char].timer);
                this.kochLongPressTimers[char] = null;
            }
        };

        this.container.addEventListener('mousedown', kochMouseDownHandler);
        this.container.addEventListener('mouseup', kochMouseUpHandler);
        this.container.addEventListener('mouseleave', kochMouseLeaveHandler);
        this.container.addEventListener('touchstart', kochMouseDownHandler);
        this.container.addEventListener('touchend', kochMouseUpHandler);
        this.eventListeners.push({ element: this.container, event: 'mousedown', handler: kochMouseDownHandler });
        this.eventListeners.push({ element: this.container, event: 'mouseup', handler: kochMouseUpHandler });
        this.eventListeners.push({ element: this.container, event: 'mouseleave', handler: kochMouseLeaveHandler });
        this.eventListeners.push({ element: this.container, event: 'touchstart', handler: kochMouseDownHandler });
        this.eventListeners.push({ element: this.container, event: 'touchend', handler: kochMouseUpHandler });

        // Single unified click handler with action routing (for non-Koch buttons)
        const clickHandler = (e) => {
            const trigger = e.target.closest('[data-action]');
            if (!trigger) return;

            const action = trigger.dataset.action;
            this.handleAction(action, e);
        };
        this.container.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: this.container, event: 'click', handler: clickHandler });

        // User input (Enter/Space handling)
        if (this.dom.inputs.user) {
            const userInputKeydownHandler = (e) => {
                if (e.key === 'Enter') {
                    const isEmpty = !this.dom.inputs.user.value.trim();
                    if (isEmpty) this.togglePlay();
                    else this.checkAnswer();
                }
                if (e.code === 'Space') {
                    const isEmpty = !this.dom.inputs.user.value.trim();
                    if (isEmpty) {
                        e.preventDefault();
                        this.togglePlay();
                    }
                }
            };
            this.dom.inputs.user.addEventListener('keydown', userInputKeydownHandler);
            this.eventListeners.push({ element: this.dom.inputs.user, event: 'keydown', handler: userInputKeydownHandler });
        }

        // Settings inputs
        this.bindSettingInputs();

        // Global keyboard shortcuts
        const globalKeydownHandler = (e) => {
            const isFocusedInApp = !document.activeElement ||
                document.activeElement === document.body ||
                this.container.contains(document.activeElement);
            if (!isFocusedInApp) return;

            if (e.key === 'Escape' && this.audioSynthesizer.isPlaying) {
                this.stopPlayback();
            }

            const isGlobalSpaceShortcut = (e.ctrlKey || e.metaKey) && e.code === 'Space';
            const isContextSpaceShortcut = e.code === 'Space' && document.activeElement !== this.dom.inputs.user;

            if (isGlobalSpaceShortcut || isContextSpaceShortcut) {
                e.preventDefault();
                this.togglePlay();
            }
        };
        document.addEventListener('keydown', globalKeydownHandler);
        this.eventListeners.push({ element: document, event: 'keydown', handler: globalKeydownHandler });
    }

    /**
     * Route actions to appropriate handlers
     * @param {string} action - The action to handle
     * @private
     */
    handleAction(action, event) {
        // Playback
        if (action === 'togglePlay') this.togglePlay();
        if (action === 'checkAnswer') this.checkAnswer();
        if (action === 'skipWord') this.generateNextChallenge();

        // AI Operations
        if (action === 'ai:broadcast') this.generateAIBroadcast();
        if (action === 'ai:coach') this.generateAICoach();

        // Tab navigation
        if (action.startsWith('tab:')) this.switchTab(action.split(':')[1]);

        // Modal operations
        if (action.startsWith('modal:')) this.handleModalAction(action);

        // Level changes
        if (action === 'level:prev') this.changeLevel(-1);
        if (action === 'level:next') this.changeLevel(1);

        // Reset confirmation
        if (action === 'confirmReset') this.confirmReset();

        // Koch grid character toggle
        if (action.startsWith('koch:')) {
            const char = action.split(':')[1];
            this.toggleChar(char);
        }
    }

    /**
     * Handle modal open/close actions
     * @param {string} action - Modal action in format "modal:name:operation"
     * @private
     */
    handleModalAction(action) {
        const parts = action.split(':');
        if (parts.length < 3) return;

        const modalName = parts[1];
        const operation = parts[2];

        if (operation === 'open') {
            this.toggleModal(modalName, true);
        } else if (operation === 'close') {
            this.toggleModal(modalName, false);
        }
    }

    /**
     * Bind setting input handlers
     * @private
     */
    bindSettingInputs() {
        const bindSetting = (selector, key) => {
            const element = typeof selector === 'string'
                ? this.container.querySelector(selector)
                : selector;

            if (!element) return;

            const handler = (e) => {
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                // Special handling for autoPlay to call toggleAutoPlay
                if (key === 'autoPlay') {
                    this.toggleAutoPlay(value);
                } else {
                    this.updateSetting(key, value);
                }
            };

            element.addEventListener('input', handler);
            this.eventListeners.push({ element, event: 'input', handler });
        };

        bindSetting(this.dom.inputs.wpm, 'wpm');
        bindSetting(this.dom.inputs.farnsworth, 'farnsworthWpm');
        bindSetting(this.dom.inputs.frequency, 'frequency');
        bindSetting(this.dom.inputs.apiKey, 'apiKey');
        bindSetting('#autoplay-toggle', 'autoPlay');
    }

    /**
     * Stop current audio playback and update UI
     * @private
     */
    stopPlayback() {
        this.audioSynthesizer.stop();
        this.renderPlayButton();
        this.renderSubmitButton();
    }

    /**
     * Play Morse code audio for given text
     * @param {string} text - Text to convert to Morse code and play
     * @private
     */
    async playMorse(text) {
        if (this.audioSynthesizer.isPlaying) {
            this.stopPlayback();
            return;
        }
        if (!text) return;

        this.hasPlayedCurrent = true;
        this.dom.inputs.user.focus();

        // Update audio settings from current state
        this.audioSynthesizer.updateSettings({
            wpm: this.stateManager.settings.wpm,
            farnsworthWpm: this.stateManager.settings.farnsworthWpm,
            frequency: this.stateManager.settings.frequency,
            volume: this.stateManager.settings.volume
        });

        await this.audioSynthesizer.play(text, () => {
            // Update UI when playback completes
            this.renderPlayButton();
        });

        this.renderPlayButton();
        this.renderSubmitButton();

        // Auto-advance if enabled after playback
        if (this.stateManager.settings.autoPlay) {
            const originalIsPlaying = this.audioSynthesizer.isPlaying;
            if (!originalIsPlaying && this.activeTab === 'train' && this.currentChallenge) {
                // Note: playback end will be tracked by audioSynthesizer
            }
        }
    }

    // --- Core Features ---
    /**
     * Toggle Morse code playback (play if stopped, stop if playing)
     * @public
     */
    togglePlay() {
        if (this.audioSynthesizer.isPlaying) {
            this.stopPlayback();
        } else {
            this.playMorse(this.currentChallenge);
        }
    }

    /**
     * Generate next training challenge (either real word or synthetic)
     * Clears input field and optionally plays the challenge
     * @param {boolean} playNow - Whether to automatically play the challenge (default: true)
     * @public
     */
    generateNextChallenge(playNow = true) {
        this.stopPlayback();
        this.dom.displays.aiTipContainer.classList.add(CSS_CLASSES.HIDDEN);

        const result = this.contentGenerator.generateChallenge(
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
        );

        this.currentChallenge = result.challenge;
        this.currentMeaning = result.meaning;
        this.hasPlayedCurrent = false;
        this.dom.inputs.user.value = '';
        this.dom.displays.feedback.classList.add('hidden');
        this.renderSubmitButton();

        if (playNow) setTimeout(() => this.playMorse(this.currentChallenge), 100);
    }

    /**
     * Check user's answer against current challenge
     * Updates stats and auto-advances level if enabled
     * @public
     */
    checkAnswer() {
        if (!this.currentChallenge || this.audioSynthesizer.isPlaying || !this.hasPlayedCurrent) return;

        const userAnswer = this.dom.inputs.user.value.toUpperCase().trim();
        const correctAnswer = this.currentChallenge.toUpperCase();
        const isCorrect = userAnswer === correctAnswer;

        // Update accuracy statistics
        correctAnswer.split('').forEach(character => {
            if (!MORSE_LIB[character]) return;
            if (!this.stateManager.stats.accuracy[character]) {
                this.stateManager.stats.accuracy[character] = { correct: 0, total: 0 };
            }
            this.stateManager.stats.accuracy[character].total++;
            if (isCorrect) {
                this.stateManager.stats.accuracy[character].correct++;
            }
        });

        // Update history
        this.stateManager.stats.history.unshift({
            challenge: correctAnswer,
            input: userAnswer,
            correct: isCorrect,
            timestamp: Date.now()
        });
        this.stateManager.stats.history = this.stateManager.stats.history.slice(0, CONTENT_GENERATION.HISTORY_LIMIT);
        
        // Update content generator's accuracy data
        this.contentGenerator.updateAccuracyData(this.stateManager.stats.accuracy);
        this.stateManager.saveStats(); // Save stats immediately, not debounced

        // Show feedback
        const feedbackElement = this.dom.displays.feedback;
        feedbackElement.classList.remove('hidden', CSS_CLASSES.SUCCESS, CSS_CLASSES.ERROR);
        
        if (isCorrect) {
            feedbackElement.classList.add(CSS_CLASSES.SUCCESS);
            feedbackElement.textContent = `${UI_FEEDBACK.CORRECT_MESSAGE}${this.currentMeaning ? ` (${this.currentMeaning})` : ''}`;
            if (this.activeTab === 'train') {
                const delay = this.stateManager.settings.autoPlay ? PLAYBACK_DELAYS.AUTO_PLAY_NEXT : 0;
                if (this.stateManager.settings.autoPlay) {
                    setTimeout(() => this.generateNextChallenge(true), delay);
                } else {
                    this.generateNextChallenge(false); // Prep next but wait
                }
            }
            this.checkAutoLevel();
        } else {
            feedbackElement.classList.add(CSS_CLASSES.ERROR);
            const displayedUserAnswer = userAnswer || UI_FEEDBACK.EMPTY_INPUT;
            feedbackElement.textContent = `You: ${displayedUserAnswer} | Answer: ${correctAnswer}${this.currentMeaning ? ` (${this.currentMeaning})` : ''}`;
        }
    }

    /**
     * Check if accuracy threshold met and adjust lesson level
     * Discards any existing challenge batch if level changes
     * @private
     */
    checkAutoLevel() {
        if (!this.stateManager.settings.autoLevel) return;
        
        const recentHistory = this.stateManager.stats.history;
        if (recentHistory.length < AUTO_LEVEL_CONFIG.ACCURACY_THRESHOLD) return;
        
        const recentDrills = recentHistory.slice(0, AUTO_LEVEL_CONFIG.HISTORY_WINDOW + 10);
        const correctCount = recentDrills.filter(entry => entry.correct).length;
        const accuracyPercentage = (correctCount / recentDrills.length) * 100;

        if (accuracyPercentage >= AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY && 
            this.stateManager.settings.lessonLevel < KOCH_SEQUENCE.length) {
            // Discard current batch since level is changing
            this.challengeQueue = [];
            this.changeLevel(1, true); // isAutoAdvance = true to play jingle
        } else if (accuracyPercentage < AUTO_LEVEL_CONFIG.LEVEL_DOWN_ACCURACY && 
                   this.stateManager.settings.lessonLevel > LEVEL_LIMITS.MIN) {
            // Discard current batch since level is changing
            this.challengeQueue = [];
            this.changeLevel(-1);
        }
    }

    /**
     * Toggle manual character availability for current level
     * Characters below current level cannot be manually locked
     * @param {string} char - Character to toggle
     * @private
     */
    toggleChar(char) {
        const lvlIdx = this.stateManager.settings.lessonLevel;
        const charIdx = KOCH_SEQUENCE.indexOf(char);
        if (charIdx < lvlIdx) return; // Locked by level

        const manual = this.stateManager.settings.manualChars;
        if (manual.includes(char)) this.stateManager.settings.manualChars = manual.filter(c => c !== char);
        else this.stateManager.settings.manualChars.push(char);
        this.stateManager.saveSettings();
        this.renderKochGrid();
    }

    /**
     * Play the morse code for a single character
     * @param {string} char - Character to play
     * @private
     */
    playKochCharacter(char) {
        this.audioSynthesizer.updateSettings({
            wpm: this.stateManager.settings.wpm,
            farnsworthWpm: this.stateManager.settings.farnsworthWpm,
            frequency: this.stateManager.settings.frequency,
            volume: this.stateManager.settings.volume
        });
        this.playMorse(char);
    }

    /**
     * Change lesson level by delta, respecting bounds and manual overrides
     * @param {number} delta - Change amount (-1 to decrease, +1 to increase)
     * @param {boolean} isAutoAdvance - Whether this is from automatic level up (plays jingle)
     * @private
     */
    changeLevel(delta, isAutoAdvance = false) {
        let newLevel = this.stateManager.settings.lessonLevel + delta;
        if (delta > 0) {
            while (newLevel < KOCH_SEQUENCE.length) {
                if (!this.stateManager.settings.manualChars.includes(KOCH_SEQUENCE[newLevel - 1])) break;
                newLevel++;
            }
        }
        newLevel = Math.max(LEVEL_LIMITS.MIN, Math.min(KOCH_SEQUENCE.length, newLevel));
        if (newLevel !== this.stateManager.settings.lessonLevel) {
            this.stateManager.settings.lessonLevel = newLevel;
            this.stateManager.saveSettings();
            this.renderKochGrid();
            
            // Play celebratory jingle on automatic level up
            if (isAutoAdvance && delta > 0) {
                this.audioSynthesizer.playJingle();
            }
        }
    }

    // --- AI / Offline Simulation ---
    /**
     * Generate AI-powered broadcast batch: Creates realistic sentences from unlocked characters
     * Falls back to offline simulation if AI unavailable
     * Generates multiple challenges at once to reduce API calls
     * @public
     */
    async generateAIBroadcast() {
        this.stopPlayback();
        this.challengeQueue = []; // Clear old queue
        this.isCurrentBatchFromNewLevel = false;
        
        const feedbackElement = this.dom.displays.feedback;
        feedbackElement.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.ERROR, CSS_CLASSES.SUCCESS);
        feedbackElement.classList.add(CSS_CLASSES.INFO);
        feedbackElement.textContent = UI_FEEDBACK.INTERCEPTING;

        this.aiOperations.generateBroadcastBatch(
            CONTENT_GENERATION.BATCH_SIZE,
            (result) => { // onSuccess
                this.challengeQueue = result.batch;
                this.loadNextQueuedChallenge(feedbackElement);
            },
            (result) => { // onFallback
                this.challengeQueue = result.batch;
                this.loadNextQueuedChallenge(feedbackElement);
            },
            (error) => { // onError
                console.error('AI broadcast batch failed:', error);
                feedbackElement.textContent = UI_FEEDBACK.AI_FAILED;
            }
        );
    }

    /**
     * Generate AI-powered smart drill batch: Targets weak characters from accuracy history
     * Falls back to offline simulation if AI unavailable
     * Generates multiple coach challenges at once
     * @public
     */
    async generateAICoach() {
        this.stopPlayback();
        this.challengeQueue = []; // Clear old queue
        this.isCurrentBatchFromNewLevel = false;
        
        const feedbackElement = this.dom.displays.feedback;
        feedbackElement.classList.remove(CSS_CLASSES.HIDDEN);
        feedbackElement.textContent = UI_FEEDBACK.CONSULTING;

        this.aiOperations.generateCoachBatch(
            CONTENT_GENERATION.BATCH_SMART_COACH_SIZE,
            (result) => { // onSuccess
                this.challengeQueue = result.batch;
                this.isCoachBatchHasWeakChars = result.hasWeakChars;
                this.loadNextQueuedChallenge(feedbackElement, result.hasWeakChars);
            },
            (result) => { // onFallback
                this.challengeQueue = result.batch;
                this.isCoachBatchHasWeakChars = result.hasWeakChars;
                this.loadNextQueuedChallenge(feedbackElement, result.hasWeakChars);
            },
            (error) => { // onError
                console.error('AI coach batch failed:', error);
                feedbackElement.textContent = UI_FEEDBACK.AI_FAILED;
            }
        );
    }

    /**
     * Load next challenge from queue and play it
     * @param {HTMLElement} feedbackElement - Element to hide
     * @param {boolean} hasWeakChars - Whether coach batch has weak chars (optional)
     * @private
     */
    loadNextQueuedChallenge(feedbackElement, hasWeakChars = null) {
        if (this.challengeQueue.length === 0) {
            feedbackElement.textContent = UI_FEEDBACK.AI_FAILED;
            return;
        }

        const challenge = this.challengeQueue.shift();
        this.currentChallenge = challenge.challenge;
        this.currentMeaning = challenge.meaning;
        this.dom.inputs.user.value = '';

        // Show coach tip if applicable
        if (hasWeakChars !== null) {
            this.dom.displays.aiTipContainer.classList.remove(CSS_CLASSES.HIDDEN);
            const tipMessage = hasWeakChars
                ? UI_FEEDBACK.WEAK_CHARS_MESSAGE
                : UI_FEEDBACK.GOOD_ACCURACY_MESSAGE;
            this.dom.displays.aiTipText.textContent = tipMessage;
        }

        feedbackElement.classList.add(CSS_CLASSES.HIDDEN);
        this.playMorse(this.currentChallenge);
    }

    // --- Render Helpers ---
    /**
     * Toggle modal visibility
     * @param {string} name - Modal identifier (settings, reset, aiHelp)
     * @param {boolean} show - Whether to show or hide the modal
     * @private
     */
    toggleModal(name, show) {
        const modal = this.dom.modals[name];
        if (modal) modal.classList.toggle(CSS_CLASSES.HIDDEN, !show);
        if (name === MODAL_IDENTIFIERS.SETTINGS && !show) {
            this.stateManager.saveSettings();
            this.renderKochGrid();
        }
    }

    /**
     * Switch active tab and update view
     * @param {string} id - Tab identifier (train, stats, guide)
     * @private
     */
    switchTab(id) {
        this.activeTab = id;
        Object.values(this.dom.tabs).forEach(b => b.classList.remove(CSS_CLASSES.ACTIVE));
        if (this.dom.tabs[id]) this.dom.tabs[id].classList.add(CSS_CLASSES.ACTIVE);
        
        Object.values(this.dom.views).forEach(v => v.classList.add(CSS_CLASSES.HIDDEN));
        if (id === 'train') this.dom.views.train.classList.remove(CSS_CLASSES.HIDDEN);
        if (id === 'stats') { this.dom.views.stats.classList.remove(CSS_CLASSES.HIDDEN); this.renderStats(); }
        if (id === 'guide') this.dom.views.guide.classList.remove(CSS_CLASSES.HIDDEN);
        
        if (id === 'train' && !this.currentChallenge) this.generateNextChallenge(false);
    }

    /**
     * Update individual setting value and trigger immediate UI update
     * @param {string} key - Setting key
     * @param {any} newValue - New value
     * @private
     */
    updateSetting(key, newValue) {
        if (key === 'apiKey') {
            this.stateManager.settings.apiKey = newValue.trim();
        } else {
            this.stateManager.settings[key] = key === 'autoPlay' ? newValue : parseInt(newValue);
        }
        this.renderSettings();
        this._debouncedSaveSettings(); // Save after UI update
    }

    /**
     * Toggle auto-play setting on/off
     * @param {boolean} newValue - New auto-play state
     * @private
     */
    toggleAutoPlay(newValue) {
        this.stateManager.settings.autoPlay = newValue;
        this._debouncedSaveSettings();
    }

    /**
     * Reset all progress and return to initial state
     * @public
     */
    confirmReset() {
        // Create fresh copies to avoid shared reference issues
        this.stateManager.stats = JSON.parse(JSON.stringify(DEFAULT_STATS));
        this.stateManager.settings.lessonLevel = LEVEL_LIMITS.MIN;
        this.stateManager.settings.manualChars = [];
        this.stateManager.saveStats();
        this.stateManager.saveSettings();
        this.toggleModal('reset', false);
        this.renderStats();
        this.renderKochGrid();
    }


    /**
     * Update and render all settings displays
     * @private
     */
    renderSettings() {
        const s = this.stateManager.settings;
        this.container.querySelector('#display-wpm').textContent = s.wpm + " WPM";
        this.container.querySelector('#display-farnsworth').textContent = s.farnsworthWpm + " WPM";
        this.container.querySelector('#display-frequency').textContent = s.frequency + " Hz";
        this.dom.inputs.wpm.value = s.wpm;
        this.dom.inputs.farnsworth.value = s.farnsworthWpm;
        this.dom.inputs.frequency.value = s.frequency;
        this.dom.inputs.apiKey.value = s.apiKey;

        const badge = this.container.querySelector('#ai-status-badge');
        if (s.apiKey) { badge.className = 'mt-badge-large active-cloud'; badge.textContent = "Active: Gemini Cloud"; }
        else if (this.aiOperations.hasBrowserAI) { badge.className = 'mt-badge-large active-local'; badge.textContent = "Active: Chrome AI"; }
        else { badge.className = 'mt-badge-large inactive'; badge.textContent = "Active: Offline Template"; }

        this.renderKochGrid();
    }

    /**
     * Update play button state (play/stop) and status text
     * @private
     */
    renderPlayButton() {
        const btn = this.dom.displays.playBtn;
        const txt = this.dom.displays.playStatus;
        if (this.audioSynthesizer.isPlaying) {
            btn.className = `mt-play-btn ${CSS_CLASSES.STOP}`;
            btn.innerHTML = ICONS.stop;
            txt.textContent = "Click to Stop";
        } else {
            btn.className = `mt-play-btn ${CSS_CLASSES.PLAY}`;
            btn.innerHTML = ICONS.play;
            txt.textContent = "Click to Play (Auto-Focus)";
        }
    }

    /**
     * Update submit button disabled state based on current challenge state
     * @private
     */
    renderSubmitButton() {
        const btn = this.dom.displays.submitBtn;
        const disabled = !this.currentChallenge || this.audioSynthesizer.isPlaying || !this.hasPlayedCurrent;
        btn.disabled = disabled;
    }

    /**
     * Render Koch progress grid with unlocked/manual indicators
     * @private
     */
    renderKochGrid() {
        const grid = this.domCache.query('#koch-grid');
        const badge = this.domCache.query('#level-badge');
        if (!grid) return;

        const lvlIdx = this.stateManager.settings.lessonLevel;
        const manual = this.stateManager.settings.manualChars;

        const fragment = document.createDocumentFragment();
        KOCH_SEQUENCE.forEach((char, idx) => {
            const btn = document.createElement('button');
            btn.className = 'mt-char-box mt-koch-btn';
            btn.textContent = char;
            btn.dataset.char = char;

            const isInLevel = idx < lvlIdx;
            const isManual = manual.includes(char);

            if (isInLevel && !isManual) btn.classList.add(CSS_CLASSES.UNLOCKED);
            else if (isManual) btn.classList.add(CSS_CLASSES.MANUAL);

            fragment.appendChild(btn);
        });

        grid.innerHTML = '';
        grid.appendChild(fragment);
        
        if (badge) badge.textContent = `Level ${lvlIdx}`;
    }

    /**
     * Render guide tab with course roadmap and abbreviation reference
     * @private
     */
    renderGuide() {
        const roadmapList = this.domCache.query('#roadmap-list');
        const abbrGrid = this.domCache.query('#abbr-grid');

        if (roadmapList) {
            const fragment = document.createDocumentFragment();
            let startIdx = 0;
            
            KOCH_LEVELS.forEach(chunk => {
                const endIdx = Math.min(chunk.end, KOCH_SEQUENCE.length);
                const chars = KOCH_SEQUENCE.slice(startIdx, endIdx).join(' ');
                const levelLabel = `Level ${startIdx + 1}-${endIdx}`;
                
                if (chars) {
                    const item = document.createElement('div');
                    item.className = 'mt-roadmap-chunk';
                    item.innerHTML = `
                        <div class="mt-roadmap-label">${levelLabel}</div>
                        <div class="mt-roadmap-content">
                            <div class="mt-roadmap-chars">${chars}</div>
                            <div class="mt-roadmap-desc">${chunk.description}</div>
                        </div>
                    `;
                    fragment.appendChild(item);
                }
                startIdx = endIdx;
            });
            
            roadmapList.innerHTML = '';
            roadmapList.appendChild(fragment);
        }

        if (abbrGrid) {
            const fragment = document.createDocumentFragment();
            COMMON_ABBR.forEach(abbr => {
                const card = document.createElement('div');
                card.className = 'mt-abbr-card';
                card.innerHTML = `<div class="mt-abbr-code">${abbr.code}</div> <div class="mt-abbr-meaning">${abbr.meaning}</div>`;
                fragment.appendChild(card);
            });
            abbrGrid.innerHTML = '';
            abbrGrid.appendChild(fragment);
        }
    }

    /**
     * Update stats view with accuracy percentage and recent history
     * @private
     */
    renderStats() {
        const accuracyElement = this.domCache.query('#stat-accuracy');
        const drillsElement = this.domCache.query('#stat-drills');
        const historyList = this.domCache.query('#history-list');

        if (accuracyElement) {
            const accuracyPercentage = calculateAccuracyPercentage(this.stateManager.stats.accuracy);
            accuracyElement.textContent = accuracyPercentage + '%';
        }

        if (drillsElement) {
            drillsElement.textContent = this.stateManager.stats.history.length;
        }

        if (historyList) {
            const fragment = document.createDocumentFragment();
            this.stateManager.stats.history.slice(0, UI_RENDERING.HISTORY_DISPLAY_LIMIT).forEach((entry) => {
                const item = document.createElement('div');
                item.className = `mt-history-item ${entry.correct ? CSS_CLASSES.SUCCESS : CSS_CLASSES.ERROR}`;
                const timeElapsedFormatted = formatTimeElapsed(Date.now() - entry.timestamp);
                item.innerHTML = `<span class="mt-history-result">${entry.correct ? '✓' : '✗'}</span> <span class="mt-history-text">${entry.challenge}</span> <span class="mt-history-time">${timeElapsedFormatted} ago</span>`;
                fragment.appendChild(item);
            });
            historyList.innerHTML = '';
            historyList.appendChild(fragment);
        }
    }
}