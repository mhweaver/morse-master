/**
 * MorseMaster - Modular Trainer Logic
 * Encapsulated ES Module for easy embedding.
 */

import { DOMCache, DOMBatch } from './dom-utils.js';
import { ErrorHandler, AICallWrapper } from './error-handler.js';
import {
  MORSE_LIB,
  KOCH_SEQUENCE,
  COMMON_ABBR,
  Q_CODES,
  PHRASES,
  DICTIONARY,
  ICONS,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  SETTINGS_RANGES,
  AUDIO_TIMING,
  PLAYBACK_DELAYS,
  AUTO_LEVEL_CONFIG,
  LEVEL_LIMITS,
  CONTENT_GENERATION,
  CSS_CLASSES,
  UI_FEEDBACK,
  AI_PROMPTS,
  KOCH_LEVELS,
  DOM_SELECTORS
} from './constants.js';

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
        
        // Initialize State
        this.audioCtx = null;
        this.sessionGain = null;
        this.playbackTimeout = null;
        this.state = {
            settings: this.loadSettings(),
            stats: this.loadStats(),
            currentChallenge: '',
            currentMeaning: '',
            isPlaying: false,
            activeTab: 'train',
            aiLoading: false,
            hasBrowserAI: false,
            aiAPI: null,
            hasPlayedCurrent: false
        };

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
        if (!this.state.settings.manualChars) {
            this.state.settings.manualChars = [];
            this.saveSettings();
        }
        
        // Init Toggle
        const toggle = this.container.querySelector('#autoplay-toggle');
        if (toggle) toggle.checked = this.state.settings.autoPlay;

        // Browser AI Check
        try {
            // Check for window.ai.languageModel (older API)
            if (window.ai && window.ai.languageModel) {
                const capabilities = await window.ai.languageModel.capabilities();
                if (capabilities && capabilities.available !== 'no') {
                    this.state.hasBrowserAI = true;
                    this.state.aiAPI = 'window.ai';
                }
            }
            // Check for window.LanguageModel (newer API)
            else if (window.LanguageModel) {
                let canUseAI = false;
                
                // Try capabilities if available
                if (window.LanguageModel.capabilities) {
                    const capabilities = await window.LanguageModel.capabilities();
                    canUseAI = capabilities && capabilities.available !== 'no';
                } else {
                    // If no capabilities method, try to create directly
                    try {
                        const testSession = await window.LanguageModel.create({ language: 'en' });
                        if (testSession && testSession.prompt) {
                            canUseAI = true;
                        }
                    } catch (e) {
                        console.log('Chrome AI check failed:', e.message);
                    }
                }
                
                if (canUseAI) {
                    this.state.hasBrowserAI = true;
                    this.state.aiAPI = 'LanguageModel';
                }
            }
        } catch (e) { 
            console.log('Browser AI initialization error:', e); 
        }

        this.bindEvents();
        this.renderSettings();
        this.renderGuide();
        this.switchTab('train');
    }

    // --- Core Logic ---
    bindEvents() {
        // Event Delegation for all clicks
        this.container.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-action]');
            if (!trigger) return;
            
            const action = trigger.dataset.action;
            
            if (action === 'togglePlay') this.togglePlay();
            if (action === 'checkAnswer') this.checkAnswer();
            if (action === 'skipWord') this.generateNextChallenge();
            if (action === 'ai:broadcast') this.generateAIBroadcast();
            if (action === 'ai:coach') this.generateAICoach();
            
            // Tabs
            if (action.startsWith('tab:')) this.switchTab(action.split(':')[1]);
            
            // Modals
            if (action === 'modal:settings:open') this.toggleModal('settings', true);
            if (action === 'modal:settings:close') this.toggleModal('settings', false);
            if (action === 'modal:reset:open') this.toggleModal('reset', true);
            if (action === 'modal:reset:close') this.toggleModal('reset', false);
            if (action === 'modal:aiHelp:open') this.toggleModal('aiHelp', true);
            if (action === 'modal:aiHelp:close') this.toggleModal('aiHelp', false);
            
            if (action === 'confirmReset') this.confirmReset();

            // Levels
            if (action === 'level:prev') this.changeLevel(-1);
            if (action === 'level:next') this.changeLevel(1);
        });

        // Koch Grid Button Clicks
        this.container.addEventListener('click', (e) => {
            const kochBtn = e.target.closest('.mt-koch-btn');
            if (kochBtn && kochBtn.dataset.char) {
                this.toggleChar(kochBtn.dataset.char);
            }
        });

        // Inputs
        this.dom.inputs.user.addEventListener('keydown', (e) => {
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
        });

        // Settings Inputs
        const bindSetting = (el, key) => {
            if (!el) return;
            el.addEventListener('input', (e) => {
                const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                if (key === 'autoPlay') this.toggleAutoPlay(val);
                else this.updateSetting(key, val);
            });
        };
        bindSetting(this.dom.inputs.wpm, 'wpm');
        bindSetting(this.dom.inputs.farnsworth, 'farnsworth');
        bindSetting(this.dom.inputs.frequency, 'frequency');
        bindSetting(this.dom.inputs.apiKey, 'apiKey');
        bindSetting(this.container.querySelector('#autoplay-toggle'), 'autoPlay');

        // Global Shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.container.contains(document.activeElement) && document.activeElement !== document.body) return; // Only if focused within app context roughly

            if (e.key === 'Escape' && this.state.isPlaying) this.stopPlayback();
            
            const isGlobal = (e.ctrlKey || e.metaKey) && e.code === 'Space';
            const isContext = e.code === 'Space' && document.activeElement !== this.dom.inputs.user;

            if (isGlobal || isContext) {
                e.preventDefault();
                this.togglePlay();
            }
        });
    }

    /**
     * Load saved settings from localStorage
     * @returns {Object} Settings object with wpm, frequency, leveland other preferences
     * @private
     */
    loadSettings() {
        try {
            const loaded = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
            if (loaded) {
                // Validate loaded settings
                const validation = ErrorHandler.validateSettings(loaded, SETTINGS_RANGES);
                if (!validation.valid) {
                    console.warn('Settings validation failed:', validation.errors.join(', '));
                }
                return loaded;
            }
            // Return a copy to avoid shared reference issues
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        } catch (error) {
            ErrorHandler.logError(error, 'Loading settings from localStorage');
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
    }

    /**
     * Persist settings to localStorage
     * @private
     */
    saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.state.settings));
        } catch (error) {
            ErrorHandler.logError(error, 'Saving settings to localStorage', {
                settingsKeys: Object.keys(this.state.settings)
            });
        }
    }
    
    /**
     * Load saved statistics from localStorage
     * @returns {Object} Stats object with history array and accuracy map
     * @private
     */
    loadStats() {
        try {
            const loaded = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS));
            if (loaded && typeof loaded === 'object') {
                return loaded;
            }
            // Return a copy to avoid shared reference issues
            return JSON.parse(JSON.stringify(DEFAULT_STATS));
        } catch (error) {
            ErrorHandler.logError(error, 'Loading stats from localStorage');
            return JSON.parse(JSON.stringify(DEFAULT_STATS));
        }
    }
    
    /**
     * Persist statistics to localStorage
     * @private
     */
    saveStats() {
        try {
            localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.state.stats));
        } catch (error) {
            ErrorHandler.logError(error, 'Saving stats to localStorage', {
                historyLength: this.state.stats.history.length,
                accuracyKeys: Object.keys(this.state.stats.accuracy).length
            });
        }
    }

    /**
     * Get or create Web Audio API context
     * @returns {AudioContext} The audio context instance
     * @private
     */
    getAudioContext() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return this.audioCtx;
    }

    /**
     * Stop current audio playback and clean up audio resources
     * @private
     */
    stopPlayback() {
        if (this.playbackTimeout) { clearTimeout(this.playbackTimeout); this.playbackTimeout = null; }
        if (this.sessionGain) {
            const now = this.audioCtx.currentTime;
            this.sessionGain.gain.cancelScheduledValues(now);
            this.sessionGain.gain.linearRampToValueAtTime(0, now + AUDIO_TIMING.SESSION_GAIN_RAMP);
            const sg = this.sessionGain;
            setTimeout(() => sg.disconnect(), AUDIO_TIMING.SESSION_GAIN_DISCONNECT);
            this.sessionGain = null;
        }
        this.state.isPlaying = false;
        this.renderPlayButton();
        this.renderSubmitButton();
    }

    /**
     * Play Morse code audio for given text using Web Audio API
     * Synthesizes sine wave with Farnsworth timing
     * @param {string} text - Text to convert to Morse code and play
     * @private
     */
    async playMorse(text) {
        if (this.state.isPlaying) { this.stopPlayback(); return; }
        if (!text) return;

        this.state.hasPlayedCurrent = true;
        this.dom.inputs.user.focus();
        this.state.isPlaying = true;
        this.renderPlayButton();
        this.renderSubmitButton();

        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();

        this.sessionGain = ctx.createGain();
        this.sessionGain.connect(ctx.destination);

        let currentTime = ctx.currentTime + AUDIO_TIMING.AUDIO_START_DELAY;
        const dotTime = AUDIO_TIMING.DOT_MULTIPLIER / this.state.settings.wpm;
        const dashTime = dotTime * AUDIO_TIMING.DASH_MULTIPLIER;
        const fRatio = AUDIO_TIMING.DOT_MULTIPLIER / this.state.settings.farnsworthWpm;
        const charSpace = fRatio * AUDIO_TIMING.char_SPACE_MULTIPLIER;
        const wordSpace = fRatio * AUDIO_TIMING.WORD_SPACE_MULTIPLIER;

        for (const char of text.toUpperCase().split('')) {
            if (char === ' ') {
                currentTime += (wordSpace - charSpace);
                continue;
            }
            const pattern = MORSE_LIB[char];
            if (!pattern) continue;

            for (let j = 0; j < pattern.length; j++) {
                const symbol = pattern[j];
                const d = (symbol === '.') ? dotTime : dashTime;
                
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(this.state.settings.frequency, currentTime);
                
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(this.state.settings.volume, currentTime + AUDIO_TIMING.AMPLITUDE_RAMP_UP);
                gain.gain.setValueAtTime(this.state.settings.volume, currentTime + d - AUDIO_TIMING.AMPLITUDE_RAMP_DOWN);
                gain.gain.linearRampToValueAtTime(0, currentTime + d);

                osc.connect(gain);
                gain.connect(this.sessionGain);
                osc.start(currentTime);
                osc.stop(currentTime + d);

                currentTime += d;
                if (j < pattern.length - 1) currentTime += dotTime;
            }
            currentTime += charSpace;
        }

        this.playbackTimeout = setTimeout(() => {
            this.state.isPlaying = false;
            this.sessionGain = null;
            this.renderPlayButton();
            this.renderSubmitButton();
        }, (currentTime - ctx.currentTime) * 1000);
    }

    // --- Core Features ---
    /**
     * Toggle Morse code playback (play if stopped, stop if playing)
     * @public
     */
    togglePlay() { this.state.isPlaying ? this.stopPlayback() : this.playMorse(this.state.currentChallenge); }

    /**
     * Get set of currently unlocked characters based on level and manual selections
     * @returns {Set<string>} Set of available characters
     * @private
     */
    getUnlockedSet() {
        const levelChars = KOCH_SEQUENCE.slice(0, this.state.settings.lessonLevel);
        return new Set([...levelChars, ...this.state.settings.manualChars]);
    }

    /**
     * Filter training content pools to only include unlocked characters
     * @returns {Object} Object with filtered words, abbreviations, Q-codes, and phrases
     * @private
     */
    getFilteredPool() {
        const unlocked = this.getUnlockedSet();
        const f = (list) => list.filter(item => {
            const txt = item.code || item;
            return txt.split('').every(c => unlocked.has(c) || c === ' ');
        });
        return { words: f(DICTIONARY), abbrs: f(COMMON_ABBR), qcodes: f(Q_CODES), phrases: f(PHRASES) };
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
        
        const unlockedSet = this.getUnlockedSet();
        const unlockedArray = Array.from(unlockedSet);
        const pool = this.getFilteredPool();
        
        const hasContent = (pool.words.length + pool.abbrs.length + pool.qcodes.length + pool.phrases.length) > 0;
        const useContent = hasContent && Math.random() < CONTENT_GENERATION.REAL_CONTENT_PROBABILITY;

        let next = '', meaning = '';

        if (useContent) {
            const types = [];
            if (pool.words.length) types.push('words');
            if (pool.abbrs.length) types.push('abbrs');
            if (pool.qcodes.length) types.push('qcodes');
            if (pool.phrases.length) types.push('phrases');
            
            const type = types[Math.floor(Math.random() * types.length)];
            const list = pool[type];
            const item = list[Math.floor(Math.random() * list.length)];
            
            if (typeof item === 'string') { next = item; } 
            else { next = item.code; meaning = item.meaning; }
        } else {
            // Synthetic
            const groups = [];
            const numGroups = Math.floor(Math.random() * (CONTENT_GENERATION.SYNTHETIC_GROUPS.max - CONTENT_GENERATION.SYNTHETIC_GROUPS.min + 1)) + CONTENT_GENERATION.SYNTHETIC_GROUPS.min;
            for(let g=0; g<numGroups; g++) {
                let s = '';
                const len = Math.floor(Math.random() * (CONTENT_GENERATION.SYNTHETIC_GROUP_LENGTH.max - CONTENT_GENERATION.SYNTHETIC_GROUP_LENGTH.min + 1)) + CONTENT_GENERATION.SYNTHETIC_GROUP_LENGTH.min;
                for(let k=0; k<len; k++) {
                    // Simple random weighting could be added here
                    s += unlockedArray[Math.floor(Math.random() * unlockedArray.length)];
                }
                groups.push(s);
            }
            next = groups.join(' ');
        }

        this.state.currentChallenge = next;
        this.state.currentMeaning = meaning;
        this.state.hasPlayedCurrent = false;
        this.dom.inputs.user.value = '';
        this.dom.displays.feedback.classList.add('hidden');
        this.renderSubmitButton();

        if (playNow) setTimeout(() => this.playMorse(next), 100);
    }

    /**
     * Check user's answer against current challenge
     * Updates stats and auto-advances level if enabled
     * @public
     */
    checkAnswer() {
        if (!this.state.currentChallenge || this.state.isPlaying || !this.state.hasPlayedCurrent) return;
        
        const guess = this.dom.inputs.user.value.toUpperCase().trim();
        const correct = this.state.currentChallenge.toUpperCase();
        const isCorrect = guess === correct;

        // Stats update
        correct.split('').forEach(c => {
            if (!MORSE_LIB[c]) return;
            if (!this.state.stats.accuracy[c]) this.state.stats.accuracy[c] = {correct:0, total:0};
            this.state.stats.accuracy[c].total++;
            if (isCorrect) this.state.stats.accuracy[c].correct++;
        });
        
        this.state.stats.history.unshift({ challenge: correct, input: guess, correct: isCorrect, timestamp: Date.now() });
        this.state.stats.history = this.state.stats.history.slice(0, CONTENT_GENERATION.HISTORY_LIMIT);
        this.saveStats();

        const fb = this.dom.displays.feedback;
        fb.classList.remove('hidden', CSS_CLASSES.SUCCESS, CSS_CLASSES.ERROR); // CSS classes instead of utility classes for modularity
        
        if (isCorrect) {
            fb.classList.add(CSS_CLASSES.SUCCESS);
            fb.textContent = `${UI_FEEDBACK.CORRECT_MESSAGE}${this.state.currentMeaning ? ` (${this.state.currentMeaning})` : ''}`;
            if (this.state.activeTab === 'train') {
                const delay = this.state.settings.autoPlay ? PLAYBACK_DELAYS.AUTO_PLAY_NEXT : 0;
                if (this.state.settings.autoPlay) setTimeout(() => this.generateNextChallenge(true), delay);
                else this.generateNextChallenge(false); // Prep next but wait
            }
            this.checkAutoLevel();
        } else {
            fb.classList.add(CSS_CLASSES.ERROR);
            fb.textContent = `You: ${guess || UI_FEEDBACK.EMPTY_INPUT} | Answer: ${correct}${this.state.currentMeaning ? ` (${this.state.currentMeaning})` : ''}`;
        }
    }

    /**
     * Check if accuracy threshold met and adjust lesson level
     * @private
     */
    checkAutoLevel() {
        if (!this.state.settings.autoLevel) return;
        const h = this.state.stats.history;
        if (h.length < AUTO_LEVEL_CONFIG.ACCURACY_THRESHOLD) return;
        const rec = h.slice(0, AUTO_LEVEL_CONFIG.HISTORY_WINDOW + 10);
        const acc = (rec.filter(x => x.correct).length / rec.length) * 100;

        if (acc >= AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY && this.state.settings.lessonLevel < KOCH_SEQUENCE.length) this.changeLevel(1);
        else if (acc < AUTO_LEVEL_CONFIG.LEVEL_DOWN_ACCURACY && this.state.settings.lessonLevel > LEVEL_LIMITS.MIN) this.changeLevel(-1);
    }

    /**
     * Toggle manual character availability for current level
     * Characters below current level cannot be manually locked
     * @param {string} char - Character to toggle
     * @private
     */
    toggleChar(char) {
        const lvlIdx = this.state.settings.lessonLevel;
        const charIdx = KOCH_SEQUENCE.indexOf(char);
        if (charIdx < lvlIdx) return; // Locked by level

        const manual = this.state.settings.manualChars;
        if (manual.includes(char)) this.state.settings.manualChars = manual.filter(c => c !== char);
        else this.state.settings.manualChars.push(char);
        this.saveSettings();
        this.renderKochGrid();
    }

    /**
     * Change lesson level by delta, respecting bounds and manual overrides
     * @param {number} delta - Change amount (-1 to decrease, +1 to increase)
     * @private
     */
    changeLevel(delta) {
        let newLevel = this.state.settings.lessonLevel + delta;
        if (delta > 0) {
            while (newLevel < KOCH_SEQUENCE.length) {
                if (!this.state.settings.manualChars.includes(KOCH_SEQUENCE[newLevel - 1])) break;
                newLevel++;
            }
        }
        newLevel = Math.max(LEVEL_LIMITS.MIN, Math.min(KOCH_SEQUENCE.length, newLevel));
        if (newLevel !== this.state.settings.lessonLevel) {
            this.state.settings.lessonLevel = newLevel;
            this.saveSettings();
            this.renderKochGrid();
        }
    }

    // --- AI / Offline Simulation ---
    /**
     * Generate AI-powered broadcast: Creates realistic sentences from unlocked characters
     * Falls back to offline simulation if AI unavailable
     * @public
     */
    async generateAIBroadcast() {
        this.stopPlayback();
        const fb = this.dom.displays.feedback;
        fb.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.ERROR, CSS_CLASSES.SUCCESS);
        fb.classList.add(CSS_CLASSES.INFO);
        fb.textContent = UI_FEEDBACK.INTERCEPTING;

        if (!this.state.settings.apiKey && !this.state.hasBrowserAI) {
            // Offline Simulation
            setTimeout(() => {
                const pool = this.getFilteredPool();
                const parts = [];
                if (Math.random() > 0.5 && pool.abbrs.length) parts.push(pool.abbrs[Math.floor(Math.random()*pool.abbrs.length)].code);
                if (pool.words.length) parts.push(pool.words[Math.floor(Math.random()*pool.words.length)]);
                if (Math.random() > 0.5 && pool.qcodes.length) parts.push(pool.qcodes[Math.floor(Math.random()*pool.qcodes.length)].code);
                
                const validParts = parts.filter(p => p.split('').every(c => this.getUnlockedSet().has(c)));
                
                if (validParts.length > 0) {
                    this.state.currentChallenge = validParts.join(' ');
                    this.state.currentMeaning = UI_FEEDBACK.SIMULATED_BROADCAST;
                } else {
                    this.generateNextChallenge(false);
                    this.state.currentMeaning = UI_FEEDBACK.WEAK_SIGNAL;
                }
                
                this.dom.inputs.user.value = '';
                fb.classList.add(CSS_CLASSES.HIDDEN);
                this.playMorse(this.state.currentChallenge);
            }, PLAYBACK_DELAYS.AI_SIMULATION_DELAY);
            return;
        }

        // Browser AI Logic
        if (this.state.hasBrowserAI) {
            try {
                let session;
                if (this.state.aiAPI === 'LanguageModel') {
                    session = await window.LanguageModel.create({ language: 'en' });
                } else {
                    session = await window.ai.languageModel.create();
                }
                const prompt = AI_PROMPTS.BROADCAST(Array.from(this.getUnlockedSet()).join(', '));
                const result = await session.prompt(prompt);
                session.destroy(); // Clean up session
                
                // Parse and validate the result
                const text = result.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
                const unlockedSet = this.getUnlockedSet();
                const validText = text.split('').every(c => c === ' ' || unlockedSet.has(c));
                
                if (validText && text.trim()) {
                    this.state.currentChallenge = text.trim();
                    this.state.currentMeaning = UI_FEEDBACK.AI_BROADCAST;
                    this.dom.inputs.user.value = '';
                    fb.classList.add(CSS_CLASSES.HIDDEN);
                    this.playMorse(this.state.currentChallenge);
                } else {
                    // Fallback to offline if AI response isn't valid
                    throw new Error('Invalid AI response');
                }
            } catch (e) {
                console.log('Browser AI generation failed:', e.message);
                // Fallback to offline simulation
                fb.textContent = UI_FEEDBACK.AI_FAILED;
                setTimeout(() => this.generateAIBroadcast(), PLAYBACK_DELAYS.AI_FALLBACK_RETRY);
                this.state.hasBrowserAI = false;
            }
        }
    }
    
    /**
     * Generate AI-powered smart drill: Targets weak characters from accuracy history
     * Falls back to offline simulation if AI unavailable
     * @public
     */
    async generateAICoach() {
        // Similar fallback logic as broadcast
        this.stopPlayback();
        const fb = this.dom.displays.feedback;
        fb.classList.remove(CSS_CLASSES.HIDDEN);
        fb.textContent = UI_FEEDBACK.CONSULTING;
        
        if (!this.state.settings.apiKey && !this.state.hasBrowserAI) {
            setTimeout(() => {
                const weak = Object.entries(this.state.stats.accuracy).filter(([_, d]) => d.total > CONTENT_GENERATION.COACH_WEAK_ATTEMPTS_THRESHOLD && d.correct/d.total < CONTENT_GENERATION.COACH_WEAK_ACCURACY_THRESHOLD).map(x=>x[0]);
                const pool = weak.length ? weak : Array.from(this.getUnlockedSet());
                const groups = [];
                for(let i=0; i<CONTENT_GENERATION.COACH_DRILL_GROUPS; i++) {
                    let s = ''; 
                    for(let k=0; k<CONTENT_GENERATION.COACH_DRILL_GROUP_LENGTH; k++) s+= pool[Math.floor(Math.random()*pool.length)];
                    groups.push(s);
                }
                this.state.currentChallenge = groups.join(' ');
                this.state.currentMeaning = UI_FEEDBACK.OFFLINE_COACH;
                this.dom.displays.aiTipContainer.classList.remove(CSS_CLASSES.HIDDEN);
                this.dom.displays.aiTipText.textContent = weak.length ? UI_FEEDBACK.WEAK_CHARS_MESSAGE : UI_FEEDBACK.GOOD_ACCURACY_MESSAGE;
                fb.classList.add(CSS_CLASSES.HIDDEN);
                this.playMorse(this.state.currentChallenge);
            }, PLAYBACK_DELAYS.AI_SIMULATION_DELAY);
            return;
        }

        // Browser AI Logic
        if (this.state.hasBrowserAI) {
            try {
                const weak = Object.entries(this.state.stats.accuracy).filter(([_, d]) => d.total > CONTENT_GENERATION.COACH_WEAK_ATTEMPTS_THRESHOLD && d.correct/d.total < CONTENT_GENERATION.COACH_WEAK_ACCURACY_THRESHOLD).map(x=>x[0]);
                let session;
                if (this.state.aiAPI === 'LanguageModel') {
                    session = await window.LanguageModel.create({ language: 'en' });
                } else {
                    session = await window.ai.languageModel.create();
                }
                const focusChars = weak.length ? weak : Array.from(this.getUnlockedSet());
                const prompt = AI_PROMPTS.COACH(focusChars.join(', '), Array.from(this.getUnlockedSet()).join(', '));
                const result = await session.prompt(prompt);
                session.destroy(); // Clean up session
                
                // Parse and validate the result
                const text = result.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
                const unlockedSet = this.getUnlockedSet();
                const validText = text.split('').every(c => c === ' ' || unlockedSet.has(c));
                
                if (validText && text) {
                    this.state.currentChallenge = text;
                    this.state.currentMeaning = "Smart Coach (AI)";
                    this.dom.displays.aiTipContainer.classList.remove(CSS_CLASSES.HIDDEN);
                    this.dom.displays.aiTipText.textContent = weak.length ? UI_FEEDBACK.WEAK_CHARS_MESSAGE : UI_FEEDBACK.DRILL_GENERATED_MESSAGE;
                    fb.classList.add(CSS_CLASSES.HIDDEN);
                    this.playMorse(this.state.currentChallenge);
                } else {
                    throw new Error('Invalid AI response');
                }
            } catch (e) {
                console.log('Browser AI coach failed:', e.message);
                // Fallback to offline simulation
                fb.textContent = UI_FEEDBACK.AI_FAILED;
                setTimeout(() => this.generateAICoach(), PLAYBACK_DELAYS.AI_FALLBACK_RETRY);
                this.state.hasBrowserAI = false;
            }
        }
    }

    // --- Render Helpers ---
    /**
     * Toggle modal visibility
     * @param {string} name - Modal identifier (settings, reset, aiHelp)
     * @param {boolean} show - Whether to show or hide the modal
     * @private
     */
    toggleModal(name, show) {
        const m = this.dom.modals[name];
        if (m) m.classList.toggle(CSS_CLASSES.HIDDEN, !show);
        if (name === 'settings' && !show) { this.saveSettings(); this.renderKochGrid(); }
    }

    /**
     * Switch active tab and update view
     * @param {string} id - Tab identifier (train, stats, guide)
     * @private
     */
    switchTab(id) {
        this.state.activeTab = id;
        Object.values(this.dom.tabs).forEach(b => b.classList.remove(CSS_CLASSES.ACTIVE));
        if (this.dom.tabs[id]) this.dom.tabs[id].classList.add(CSS_CLASSES.ACTIVE);
        
        Object.values(this.dom.views).forEach(v => v.classList.add(CSS_CLASSES.HIDDEN));
        if (id === 'train') this.dom.views.train.classList.remove(CSS_CLASSES.HIDDEN);
        if (id === 'stats') { this.dom.views.stats.classList.remove(CSS_CLASSES.HIDDEN); this.renderStats(); }
        if (id === 'guide') this.dom.views.guide.classList.remove(CSS_CLASSES.HIDDEN);
        
        if (id === 'train' && !this.state.currentChallenge) this.generateNextChallenge(false);
    }

    /**
     * Update individual setting value
     * @param {string} key - Setting key
     * @param {any} val - New value
     * @private
     */
    updateSetting(key, val) {
        if(key === 'apiKey') this.state.settings.apiKey = val.trim();
        else this.state.settings[key] = key === 'autoPlay' ? val : parseInt(val);
        this.renderSettings();
    }

    /**
     * Toggle auto-play setting on/off
     * @param {boolean} val - New auto-play state
     * @private
     */
    toggleAutoPlay(val) {
        this.state.settings.autoPlay = val;
        this.saveSettings();
    }

    /**
     * Reset all progress and return to initial state
     * @public
     */
    confirmReset() {
        // Create fresh copies to avoid shared reference issues
        this.state.stats = JSON.parse(JSON.stringify(DEFAULT_STATS));
        this.state.settings.lessonLevel = LEVEL_LIMITS.MIN;
        this.state.settings.manualChars = [];
        this.saveStats();
        this.saveSettings();
        this.toggleModal('reset', false);
        this.renderStats();
        this.renderKochGrid();
    }


    /**
     * Update and render all settings displays
     * @private
     */
    renderSettings() {
        const s = this.state.settings;
        this.container.querySelector('#display-wpm').textContent = s.wpm + " WPM";
        this.container.querySelector('#display-farnsworth').textContent = s.farnsworthWpm + " WPM";
        this.container.querySelector('#display-frequency').textContent = s.frequency + " Hz";
        this.dom.inputs.wpm.value = s.wpm;
        this.dom.inputs.farnsworth.value = s.farnsworthWpm;
        this.dom.inputs.frequency.value = s.frequency;
        this.dom.inputs.apiKey.value = s.apiKey;
        
        const badge = this.container.querySelector('#ai-status-badge');
        if (s.apiKey) { badge.className = 'mt-badge-large active-cloud'; badge.textContent = "Active: Gemini Cloud"; }
        else if (this.state.hasBrowserAI) { badge.className = 'mt-badge-large active-local'; badge.textContent = "Active: Chrome AI"; }
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
        if (this.state.isPlaying) {
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
        const disabled = !this.state.currentChallenge || this.state.isPlaying || !this.state.hasPlayedCurrent;
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

        const lvlIdx = this.state.settings.lessonLevel;
        const manual = this.state.settings.manualChars;

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
        const accuracyDiv = this.domCache.query('#stat-accuracy');
        const drillsDiv = this.domCache.query('#stat-drills');
        const historyList = this.domCache.query('#history-list');

        if (accuracyDiv) {
            const acc = this.state.stats.accuracy;
            const totalCorrect = Object.values(acc).reduce((sum, d) => sum + d.correct, 0);
            const totalAttempts = Object.values(acc).reduce((sum, d) => sum + d.total, 0);
            const pct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
            accuracyDiv.textContent = pct + '%';
        }

        if (drillsDiv) {
            drillsDiv.textContent = this.state.stats.history.length;
        }

        if (historyList) {
            const fragment = document.createDocumentFragment();
            this.state.stats.history.slice(0, 20).forEach((entry, idx) => {
                const item = document.createElement('div');
                item.className = `mt-history-item ${entry.correct ? CSS_CLASSES.SUCCESS : CSS_CLASSES.ERROR}`;
                const timeago = Math.round((Date.now() - entry.timestamp) / 1000);
                const timeStr = timeago < 60 ? timeago + 's' : (Math.round(timeago / 60) + 'm');
                item.innerHTML = `<span class="mt-history-result">${entry.correct ? '✓' : '✗'}</span> <span class="mt-history-text">${entry.challenge}</span> <span class="mt-history-time">${timeStr} ago</span>`;
                fragment.appendChild(item);
            });
            historyList.innerHTML = '';
            historyList.appendChild(fragment);
        }
    }
}