/**
 * MorseMaster - Modular Trainer Logic
 * Encapsulated ES Module for easy embedding.
 */

import { DOMCache } from './dom-utils.js';
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
  CONTENT_GENERATION,
  MODAL_IDENTIFIERS,
  DEFAULT_SETTINGS,
  SETTINGS_RANGES,
  PLAYBACK_DELAYS,
  DEFAULT_STATS,
  DIFFICULTY_PRESETS,
  DIFFICULTY
} from './constants.js';
import { COMMON_ABBR } from './content-generator.js';
import {
  formatTimeElapsed,
  deepClone
} from './utils.js';
import { AccuracyTracker } from './accuracy-tracker.js';
import { AudioSynthesizer } from './audio-synthesizer.js';
import { StateManager } from './state-manager.js';
import { ContentGenerator } from './content-generator.js';
import { AIOperations } from './ai-operations.js';
import { DifficultyCalculator } from './difficulty-calculator.js';

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
        // Wrap accuracy data in AccuracyTracker for self-documenting interface
        this.accuracyTracker = new AccuracyTracker(this.stateManager.stats.accuracy);
        this.difficultyCalculator = new DifficultyCalculator(
            this.accuracyTracker,
            this.stateManager.settings.difficultyPreference
        );
        this.contentGenerator = new ContentGenerator(
            this.accuracyTracker,
            this.stateManager.settings.difficultyPreference,
            this.stateManager.settings.userCallsign
        );
        this.aiOperations = new AIOperations(this.stateManager, this.contentGenerator);

        // Initialize application state
        this.currentChallenge = '';
        this.currentMeaning = '';
        this.lastChallengeDifficulty = 5; // Default middle difficulty
        this.activeTab = 'train';
        this.hasPlayedCurrent = false;
        this.eventListeners = []; // Track listeners for cleanup
        this.kochLongPressTimers = {}; // Track long-press timers for Koch buttons
        
        // Session tracking for warm-up/cool-down effects
        this.sessionChallengesCount = 0;
        this.lastSessionDateIso = this.stateManager.stats.sessionMetrics?.lastSessionDate;
        
        // Challenge queue for batch generation
        this.challengeQueue = [];
        this.isCurrentBatchFromNewLevel = false; // Track if batch was generated before level change

        // Render Initial DOM Structure
        this.renderStructure();

        // Initialize DOM Cache for dynamic queries
        this.domCache = new DOMCache(this.container);

        // Cache DOM References
        this.dom = {
            views: {
                train: this.container.querySelector('#view-train'),
                stats: this.container.querySelector('#view-stats'),
                guide: this.container.querySelector('#view-guide'),
                settings: this.container.querySelector('#view-settings')
            },
            inputs: {
                user: this.container.querySelector('#user-input'),
                wpm: this.container.querySelector('#input-wpm'),
                farnsworth: this.container.querySelector('#input-farnsworth'),
                frequency: this.container.querySelector('#input-frequency'),
                apiKey: this.container.querySelector('#input-api-key'),
                difficulty: this.container.querySelector('#input-difficulty'),
                userCallsign: this.container.querySelector('#input-user-callsign')
            },
            displays: {
                feedback: this.container.querySelector('#feedback-msg'),
                playBtn: this.container.querySelector('#play-btn'),
                playStatus: this.container.querySelector('#play-status-text'),
                levelBadge: this.container.querySelector('#level-badge'),
                kochGrid: this.container.querySelector('#koch-grid'),
                statsAcc: this.container.querySelector('#stat-accuracy'),
                statsDrills: this.container.querySelector('#stat-drills'),
                characterBreakdown: this.container.querySelector('#character-breakdown'),
                historyList: this.container.querySelector('#history-list'),
                abbrGrid: this.container.querySelector('#abbr-grid'),
                roadmap: this.container.querySelector('#roadmap-list'),
                aiTipContainer: this.container.querySelector('#ai-tip-container'),
                aiTipText: this.container.querySelector('#ai-tip-text'),
                submitBtn: this.container.querySelector('#submit-btn'),
                weakCharFeedback: this.container.querySelector('#weak-char-feedback'),
                weakCharList: this.container.querySelector('#weak-char-list')
            },
            modals: {
                reset: this.container.querySelector('#modal-reset'),
                characterDetail: this.container.querySelector('#modal-character-detail'),
                aiHelp: this.container.querySelector('#modal-ai-help')
            },
            tabs: {
                train: this.container.querySelector('#tab-btn-train'),
                stats: this.container.querySelector('#tab-btn-stats'),
                guide: this.container.querySelector('#tab-btn-guide'),
                settings: this.container.querySelector('#tab-btn-settings')
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
                            <button id="tab-btn-settings" class="mt-nav-btn" data-action="tab:settings">Settings</button>
                        </nav>
                    </div>
                </header>

                <main class="mt-main">
                    <!-- TRAIN VIEW -->
                    <div id="view-train" class="mt-view">
                        <div class="mt-card mt-play-area">
                            <div id="ai-tip-container" class="mt-ai-tip hidden">
                                <strong>Coach's Tip:</strong> <span id="ai-tip-text"></span>
                            </div>
                            <div id="weak-char-feedback" class="mt-weak-char-feedback hidden">
                                <span class="mt-weak-char-icon">🎯</span> Focusing on: <strong id="weak-char-list"></strong>
                            </div>
                            <div class="mt-play-controls">
                                <button id="play-btn" class="mt-play-btn" data-action="togglePlay">${ICONS.play}</button>
                                <p id="play-status-text" class="mt-hint">Click to Play</p>
                                <div id="difficulty-display" class="mt-difficulty-display hidden">
                                    <div class="mt-difficulty-meter">
                                        <div id="difficulty-bar" class="mt-difficulty-bar" style="width: 50%;"></div>
                                    </div>
                                    <div class="mt-difficulty-info">
                                        <span id="difficulty-number" class="mt-difficulty-number">5/10</span>
                                        <span id="difficulty-label" class="mt-difficulty-label">Medium</span>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-input-wrapper">
                                <input type="text" id="user-input" class="mt-input-large" placeholder="Type answer..." autocomplete="off">
                                <div id="feedback-msg" class="mt-feedback hidden"></div>
                            </div>
                            <button id="submit-btn" class="mt-btn-primary" data-action="checkAnswer">Check Answer</button>
                            <div class="mt-sub-controls">
                                <button class="mt-btn-text" data-action="skipWord">${ICONS.skip} Skip</button>
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

                        <!-- Level Progress Tracker -->
                        <div id="level-progress-card" class="mt-card">
                            <div class="mt-section-header">
                                <h3>Level Progress</h3>
                            </div>
                            <div class="mt-progress-tracker">
                                <div class="mt-progress-stats">
                                    <div class="mt-progress-stat">
                                        <span class="mt-label">Current Level</span>
                                        <span id="progress-level" class="mt-value">2</span>
                                    </div>
                                    <div class="mt-progress-stat">
                                        <span class="mt-label">Recent Accuracy</span>
                                        <span id="progress-accuracy" class="mt-value">--</span>
                                    </div>
                                </div>
                                <div class="mt-progress-bar-container">
                                    <div class="mt-progress-bar-bg">
                                        <div id="progress-bar-fill" class="mt-progress-bar-fill" style="width: 0%;"></div>
                                    </div>
                                    <p id="progress-message" class="mt-progress-message">Complete 15 challenges to evaluate progress</p>
                                </div>
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

                        <div id="session-summary-card" class="mt-card hidden">
                            <h3 id="session-summary-title">📊 This Session</h3>
                            <div class="mt-session-summary">
                                <div class="mt-session-stat">
                                    <span class="mt-label">Challenges:</span>
                                    <span id="session-challenges" class="mt-value">0</span>
                                </div>
                                <div id="session-improvements" class="mt-improvements-list"></div>
                                <div id="session-weak-chars" class="mt-weak-chars-summary hidden">
                                    <p class="mt-text-muted">🎯 Focused on: <strong id="session-weak-list"></strong></p>
                                </div>
                            </div>
                        </div>

                        <!-- CHARACTER MASTERY BREAKDOWN -->
                        <div class="mt-card">
                            <h3>Character Mastery</h3>
                            <p class="mt-text-muted" style="font-size: 0.9rem; margin-bottom: 1rem;">
                                Red = Weak (needs practice) • Yellow = Learning • Green = Proficient
                            </p>
                            <div id="character-breakdown" class="mt-char-grid"></div>
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
                        <div class="mt-card">
                            <h3>Understanding Difficulty</h3>
                            <p><strong>Each challenge you see gets a difficulty rating from 1-10.</strong> This rating is based on the challenge content itself, not your settings.</p>
                            
                            <h4 style="margin-top: 1rem;">What Makes a Challenge Harder or Easier?</h4>
                            <ul class="mt-guide-list">
                                <li><strong>Length:</strong> Longer challenges are harder than short ones</li>
                                <li><strong>Your Weak Characters:</strong> If the challenge includes characters you struggle with, it's rated harder</li>
                                <li><strong>New Characters:</strong> When you first unlock a new character, challenges using it get easier temporarily to help you learn (grace period)</li>
                                <li><strong>Pattern Similarity:</strong> Some characters sound similar in morse code (E, T, A). Challenges mixing these are harder</li>
                            </ul>

                            <h4 style="margin-top: 1rem;">Difficulty Scale</h4>
                            <div class="mt-difficulty-scale-guide">
                                <div class="mt-scale-item">
                                    <div class="mt-scale-bar" style="background-color: #10b981;"></div>
                                    <div><strong>1-2: Very Easy</strong> <span class="mt-text-muted">Short, familiar characters</span></div>
                                </div>
                                <div class="mt-scale-item">
                                    <div class="mt-scale-bar" style="background-color: #84cc16;"></div>
                                    <div><strong>3-4: Easy</strong> <span class="mt-text-muted">Mostly strong characters</span></div>
                                </div>
                                <div class="mt-scale-item">
                                    <div class="mt-scale-bar" style="background-color: #eab308;"></div>
                                    <div><strong>5-6: Medium</strong> <span class="mt-text-muted">Mixed difficulty</span></div>
                                </div>
                                <div class="mt-scale-item">
                                    <div class="mt-scale-bar" style="background-color: #f97316;"></div>
                                    <div><strong>7-8: Hard</strong> <span class="mt-text-muted">Multiple weak characters</span></div>
                                </div>
                                <div class="mt-scale-item">
                                    <div class="mt-scale-bar" style="background-color: #ef4444;"></div>
                                    <div><strong>9-10: Very Hard</strong> <span class="mt-text-muted">Long, complex combinations</span></div>
                                </div>
                            </div>

                            <h4 style="margin-top: 1rem;">Challenge Pool: Which Characters Do You See?</h4>
                            <p>The characters that appear in your challenges are determined by your current <strong>Koch level</strong> (shown at the bottom of the train view). You start with K and M, and unlock new characters as you progress. New characters are always added incrementally following the Koch method—you won't suddenly see all of them at once.</p>

                            <h4 style="margin-top: 1rem;">Learning Speed: Controlling Progression</h4>
                            <p>The <strong>Learning Speed</strong> slider in Settings controls how quickly you unlock new characters. It doesn't change which challenges you see—just how long you practice current characters before introducing new ones:</p>
                            <ul class="mt-guide-list">
                                <li><strong>Very Slow (Left):</strong> Master each character thoroughly before unlocking new ones</li>
                                <li><strong>Slow to Fast (Middle):</strong> Balanced progression speeds</li>
                                <li><strong>Very Fast (Right):</strong> Unlock new characters quickly</li>
                            </ul>
                            <p style="margin-top: 0.75rem;"><em>Tip: If challenges feel too hard, slow down your learning speed to progress more gradually. This gives you more time to practice and build confidence with current characters.</em></p>
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

                    <!-- SETTINGS VIEW -->
                    <div id="view-settings" class="mt-view hidden">
                        <div class="mt-card">
                            <h2>Settings</h2>
                            <div class="mt-form-group">
                                <label>Learning Speed <span id="display-difficulty">${this._getDifficultyLabel(DEFAULT_SETTINGS.difficultyPreference)}</span></label>
                                <input type="range" id="input-difficulty" min="${SETTINGS_RANGES.difficultyPreference.min}" max="${SETTINGS_RANGES.difficultyPreference.max}" data-action="setting:difficulty">
                                <p class="mt-hint" id="difficulty-description">${this._getDifficultyDescription(DEFAULT_SETTINGS.difficultyPreference)}</p>
                            </div>
                            <div class="mt-form-group">
                                <label>Char Speed <span id="display-wpm">${DEFAULT_SETTINGS.wpm} WPM</span></label>
                                <input type="range" id="input-wpm" min="${SETTINGS_RANGES.wpm.min}" max="${SETTINGS_RANGES.wpm.max}" data-action="setting:wpm">
                                <p class="mt-hint">Speed at which individual characters are transmitted. Higher = faster characters. Typically 15-25 WPM for learning.</p>
                            </div>
                            <div class="mt-form-group">
                                <label>Effective Speed <span id="display-farnsworth">${DEFAULT_SETTINGS.farnsworthWpm} WPM</span></label>
                                <input type="range" id="input-farnsworth" min="${SETTINGS_RANGES.farnsworthWpm.min}" max="${SETTINGS_RANGES.farnsworthWpm.max}" data-action="setting:farnsworth">
                                <p class="mt-hint">Overall learning pace (Farnsworth timing). Characters are sent fast but spaced out. Lower = more thinking time between characters.</p>
                            </div>
                            <div class="mt-form-group">
                                <label>Tone Frequency <span id="display-frequency">${DEFAULT_SETTINGS.frequency} Hz</span></label>
                                <input type="range" id="input-frequency" min="${SETTINGS_RANGES.frequency.min}" max="${SETTINGS_RANGES.frequency.max}" step="${SETTINGS_RANGES.frequency.step}" data-action="setting:frequency">
                                <p class="mt-hint">Pitch of the morse code tone. Choose what's most comfortable for your ears. Standard is around 600-700 Hz.</p>
                            </div>
                            <div class="mt-form-group border-top">
                                <label>Your Callsign (Optional)</label>
                                <input type="text" id="input-user-callsign" class="mt-input" placeholder="e.g., K1ABC, W2XYZ" maxlength="10" data-action="setting:userCallsign">
                                <p class="mt-hint">Your callsign will appear frequently in training challenges</p>
                            </div>
                            <div class="mt-form-group border-top">
                                <label>Gemini API Key (Optional)</label>
                                <input type="password" id="input-api-key" class="mt-input" placeholder="Enter key..." data-action="setting:apiKey">
                                <p class="mt-hint">App will use: Gemini Cloud API → Chrome On-Device AI → Offline Template Engine</p>
                                <div id="ai-status-badge" class="mt-badge-large">Checking...</div>
                            </div>
                        </div>
                    </div>
                </main>

                <!-- Character Detail Modal -->
                <div id="modal-character-detail" class="mt-modal hidden">
                    <div class="mt-modal-content">
                        <div class="mt-modal-header">
                            <h2 id="char-detail-name"></h2>
                            <button class="mt-close-btn" data-action="modal:characterDetail:close">&times;</button>
                        </div>
                        <div class="mt-modal-body">
                            <div class="mt-char-detail-container">
                                <div class="mt-detail-tier">
                                    <span class="mt-detail-label">Mastery Tier:</span>
                                    <span id="char-detail-tier" class="mt-detail-value"></span>
                                </div>
                                <div class="mt-detail-accuracy">
                                    <span class="mt-detail-label">Accuracy:</span>
                                    <span id="char-detail-accuracy" class="mt-detail-value"></span>
                                </div>
                                <div class="mt-detail-attempts">
                                    <span class="mt-detail-label">Attempts:</span>
                                    <span id="char-detail-attempts" class="mt-detail-value"></span>
                                </div>
                                <div class="mt-detail-correct">
                                    <span class="mt-detail-label">Correct:</span>
                                    <span id="char-detail-correct" class="mt-detail-value"></span>
                                </div>
                                <div class="mt-detail-incorrect">
                                    <span class="mt-detail-label">Incorrect:</span>
                                    <span id="char-detail-incorrect" class="mt-detail-value"></span>
                                </div>
                                <div id="char-detail-advice" class="mt-detail-advice"></div>
                            </div>
                        </div>
                        <div class="mt-modal-footer">
                            <button class="mt-btn-primary" data-action="modal:characterDetail:close">Close</button>
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

                <!-- Footer -->
                <footer class="mt-footer">
                    <p>
                        <a href="https://github.com/mhweaver/morse-master/" target="_blank" rel="noopener noreferrer">
                            View Project on GitHub
                        </a>
                    </p>
                </footer>
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

        // Character detail view
        if (action.startsWith('char:')) {
            const char = action.split(':')[1];
            this.showCharacterDetail(char);
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

        bindSetting(this.dom.inputs.difficulty, 'difficultyPreference');
        bindSetting(this.dom.inputs.wpm, 'wpm');
        bindSetting(this.dom.inputs.farnsworth, 'farnsworthWpm');
        bindSetting(this.dom.inputs.frequency, 'frequency');
        bindSetting(this.dom.inputs.apiKey, 'apiKey');
        bindSetting(this.dom.inputs.userCallsign, 'userCallsign');
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
        
        if (result.weakChars && result.weakChars.length > 0) {
            // Ensure sessionMetrics exists
            if (!this.stateManager.stats.sessionMetrics) {
                this.stateManager.stats.sessionMetrics = { challengesInSession: 0, lastSessionDate: null, weakCharsFocused: [], sessionStartAccuracy: {} };
            }
            const weakCharSet = new Set(this.stateManager.stats.sessionMetrics.weakCharsFocused || []);
            result.weakChars.forEach(char => weakCharSet.add(char));
            this.stateManager.stats.sessionMetrics.weakCharsFocused = Array.from(weakCharSet);
        }
        
        // Calculate and store challenge difficulty (1-10 scale)
        const unlockedChars = new Set(KOCH_SEQUENCE.slice(0, this.stateManager.settings.lessonLevel));
        this.lastChallengeDifficulty = this.difficultyCalculator.calculateChallengeDifficulty(
            this.currentChallenge,
            unlockedChars
        );
        
        this.renderSubmitButton();
        this.renderDifficultyDisplay();
        this.updateWeakCharacterFeedback();

        if (playNow) setTimeout(() => this.playMorse(this.currentChallenge), 100);
    }

    /**
     * Check user's answer against current challenge
     * Updates stats and auto-advances level if enabled
     * @public
     */
    checkAnswer() {
        if (!this.currentChallenge || this.audioSynthesizer.isPlaying || !this.hasPlayedCurrent) return;

        // Track session metrics
        const today = new Date().toISOString().split('T')[0];
        const wasNewDay = !this.lastSessionDateIso || this.lastSessionDateIso !== today;
        if (wasNewDay) {
            this.sessionChallengesCount = 0;
            this.lastSessionDateIso = today;
            
            // Ensure sessionMetrics exists
            if (!this.stateManager.stats.sessionMetrics) {
                this.stateManager.stats.sessionMetrics = { challengesInSession: 0, lastSessionDate: null, weakCharsFocused: [], sessionStartAccuracy: {} };
            }
            
            this.stateManager.stats.sessionMetrics.weakCharsFocused = [];
            this.stateManager.stats.sessionMetrics.sessionStartAccuracy = {};
            Object.keys(this.stateManager.stats.accuracy).forEach(char => {
                const stats = this.stateManager.stats.accuracy[char];
                const accuracy = stats.total > 0 ? (stats.correct / stats.total) : 0;
                this.stateManager.stats.sessionMetrics.sessionStartAccuracy[char] = accuracy;
            });
        }
        this.sessionChallengesCount++;
        
        // Ensure sessionMetrics exists
        if (!this.stateManager.stats.sessionMetrics) {
            this.stateManager.stats.sessionMetrics = { challengesInSession: 0, lastSessionDate: null, weakCharsFocused: [], sessionStartAccuracy: {} };
        }
        
        // Persist session metrics
        this.stateManager.stats.sessionMetrics.challengesInSession = this.sessionChallengesCount;
        this.stateManager.stats.sessionMetrics.lastSessionDate = today;

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
        // Recreate AccuracyTracker from updated plain object
        this.accuracyTracker = new AccuracyTracker(this.stateManager.stats.accuracy);
        this.contentGenerator.updateAccuracyData(this.accuracyTracker);
        this.stateManager.saveStats(); // Save stats immediately, not debounced

        // Show feedback
        const feedbackElement = this.dom.displays.feedback;
        feedbackElement.classList.remove('hidden', CSS_CLASSES.SUCCESS, CSS_CLASSES.ERROR);
        
        if (isCorrect) {
            feedbackElement.classList.add(CSS_CLASSES.SUCCESS);
            const feedbackText = `${UI_FEEDBACK.CORRECT_MESSAGE}${this.currentMeaning ? ` (${this.currentMeaning})` : ''}\n💡 Difficulty: ${Math.round(this.lastChallengeDifficulty || 5)}/10`;
            feedbackElement.textContent = feedbackText;
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
            const feedbackText = `You: ${displayedUserAnswer} | Answer: ${correctAnswer}${this.currentMeaning ? ` (${this.currentMeaning})` : ''}\n💡 Difficulty: ${Math.round(this.lastChallengeDifficulty || 5)}/10`;
            feedbackElement.textContent = feedbackText;
            this.checkAutoLevel();
        }

        this.renderLevelProgress();
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
            this.renderLevelProgress();
            
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

        // Calculate difficulty for queued challenges too
        const unlockedChars = new Set(KOCH_SEQUENCE.slice(0, this.stateManager.settings.lessonLevel));
        this.lastChallengeDifficulty = this.difficultyCalculator.calculateChallengeDifficulty(
            this.currentChallenge,
            unlockedChars
        );

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
        if (id === 'train') {
            this.dom.views.train.classList.remove(CSS_CLASSES.HIDDEN);
            this.renderLevelProgress();
        }
        if (id === 'stats') { this.dom.views.stats.classList.remove(CSS_CLASSES.HIDDEN); this.renderStats(); }
        if (id === 'guide') this.dom.views.guide.classList.remove(CSS_CLASSES.HIDDEN);
        if (id === 'settings') this.dom.views.settings.classList.remove(CSS_CLASSES.HIDDEN);
        
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
        } else if (key === 'userCallsign') {
            this.stateManager.settings.userCallsign = newValue.toUpperCase().trim();
            this.contentGenerator.updateUserCallsign(newValue);
        } else {
            this.stateManager.settings[key] = key === 'autoPlay' ? newValue : parseInt(newValue);
        }
        
        // Apply difficulty preference to content generator and difficulty calculator
        if (key === 'difficultyPreference') {
            this.contentGenerator.updateDifficultyPreference(parseInt(newValue));
            this.difficultyCalculator.applyDifficultyPreset(parseInt(newValue));
        }
        
        this.renderSettings();
        this.stateManager.saveSettings();
    }

    /**
     * Toggle auto-play setting on/off
     * @param {boolean} newValue - New auto-play state
     * @private
     */
    toggleAutoPlay(newValue) {
        this.stateManager.settings.autoPlay = newValue;
        this.stateManager.saveSettings();
    }

    /**
     * Reset all progress and return to initial state
     * @public
     */
    confirmReset() {
        // Create fresh copies to avoid shared reference issues
        this.stateManager.stats = deepClone(DEFAULT_STATS);
        this.stateManager.settings.lessonLevel = LEVEL_LIMITS.MIN;
        this.stateManager.settings.manualChars = [];
        this.stateManager.saveStats();
        this.stateManager.saveSettings();
        
        // Reset session tracking
        this.sessionChallengesCount = 0;
        this.lastSessionDateIso = null;
        
        // Recreate AccuracyTracker with fresh stats
        this.accuracyTracker = new AccuracyTracker(this.stateManager.stats.accuracy);
        this.contentGenerator.updateAccuracyData(this.accuracyTracker);
        
        this.toggleModal('reset', false);
        this.renderStats();
        this.renderKochGrid();
        this.renderCharacterBreakdown();
    }


    /**
     * Update and render all settings displays
     * @private
     */
    renderSettings() {
        const s = this.stateManager.settings;
        this.container.querySelector('#display-difficulty').textContent = this._getDifficultyLabel(s.difficultyPreference);
        this.container.querySelector('#difficulty-description').textContent = this._getDifficultyDescription(s.difficultyPreference);
        this.container.querySelector('#display-wpm').textContent = s.wpm + " WPM";
        this.container.querySelector('#display-farnsworth').textContent = s.farnsworthWpm + " WPM";
        this.container.querySelector('#display-frequency').textContent = s.frequency + " Hz";
        this.dom.inputs.difficulty.value = s.difficultyPreference;
        this.dom.inputs.wpm.value = s.wpm;
        this.dom.inputs.farnsworth.value = s.farnsworthWpm;
        this.dom.inputs.frequency.value = s.frequency;
        this.dom.inputs.apiKey.value = s.apiKey || '';
        this.dom.inputs.userCallsign.value = s.userCallsign || '';

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
            txt.textContent = "Click to Play";
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
     * Convert difficulty number (1-10) to a label string
     * @param {number} difficulty - Difficulty value 1-10
     * @returns {string} Label like "Very Easy", "Medium", "Hard"
     * @private
     */
    _getDifficultyLabelForChallenge(difficulty) {
        if (difficulty <= 2) return 'Very Easy';
        if (difficulty <= 4) return 'Easy';
        if (difficulty <= 6) return 'Medium';
        if (difficulty <= 8) return 'Hard';
        return 'Very Hard';
    }

    /**
     * Convert difficulty number (1-10) to a color for visual display
     * @param {number} difficulty - Difficulty value 1-10
     * @returns {string} CSS color value
     * @private
     */
    _getDifficultyColor(difficulty) {
        if (difficulty <= 2) return '#10b981'; // Green
        if (difficulty <= 4) return '#84cc16'; // Light green/lime
        if (difficulty <= 6) return '#eab308'; // Yellow
        if (difficulty <= 8) return '#f97316'; // Orange
        return '#ef4444'; // Red
    }

    /**
     * Render level progress tracker showing recent accuracy and progress to next level
     * @private
     */
    renderLevelProgress() {
        const progressLevel = this.domCache.query('#progress-level');
        const progressAccuracy = this.domCache.query('#progress-accuracy');
        const progressBarFill = this.domCache.query('#progress-bar-fill');
        const progressMessage = this.domCache.query('#progress-message');
        
        if (!progressLevel || !progressAccuracy || !progressBarFill || !progressMessage) return;
        
        const currentLevel = this.stateManager.settings.lessonLevel;
        const recentHistory = this.stateManager.stats.history;
        const autoLevelEnabled = this.stateManager.settings.autoLevel;
        
        // Update current level
        progressLevel.textContent = currentLevel;
        
        // Check if we have enough history
        if (recentHistory.length < AUTO_LEVEL_CONFIG.ACCURACY_THRESHOLD) {
            const needed = AUTO_LEVEL_CONFIG.ACCURACY_THRESHOLD - recentHistory.length;
            progressAccuracy.textContent = '--';
            progressBarFill.style.width = '0%';
            progressBarFill.style.backgroundColor = '#6b7280'; // Gray
            progressMessage.textContent = `Complete ${needed} more challenge${needed > 1 ? 's' : ''} to unlock progress tracking`;
            progressMessage.className = 'mt-progress-message';
            return;
        }
        
        // Calculate recent accuracy
        const recentDrills = recentHistory.slice(0, AUTO_LEVEL_CONFIG.HISTORY_WINDOW + 10);
        const correctCount = recentDrills.filter(entry => entry.correct).length;
        const accuracyPercentage = (correctCount / recentDrills.length) * 100;
        
        progressAccuracy.textContent = `${accuracyPercentage.toFixed(1)}%`;
        
        // Update progress bar (0-100% mapped to accuracy 60-90%)
        let barPercentage = 0;
        let barColor = '#ef4444'; // Red (struggling)
        let message = '';
        
        if (accuracyPercentage >= AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY) {
            // Ready to level up (or would level up if auto-level enabled)
            barPercentage = 100;
            barColor = '#10b981'; // Green
            if (autoLevelEnabled) {
                if (currentLevel >= KOCH_SEQUENCE.length) {
                    message = '🎉 Maximum level reached! You\'ve mastered all characters!';
                } else {
                    message = `🎯 Excellent! Maintaining ${AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY}%+ accuracy — you\'ll advance to Level ${currentLevel + 1} on your next correct answer!`;
                }
            } else {
                message = `✓ Strong performance (${accuracyPercentage.toFixed(1)}% ≥ ${AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY}%)! Auto-level is disabled — use manual override to advance.`;
            }
        } else if (accuracyPercentage >= 80) {
            // Close to leveling up
            barPercentage = ((accuracyPercentage - 80) / (AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY - 80)) * 100;
            barColor = '#84cc16'; // Light green
            const pointsNeeded = (AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY - accuracyPercentage).toFixed(1);
            // Calculate how many more correct answers needed
            const totalRecent = recentDrills.length;
            const currentCorrect = correctCount;
            const targetCorrect = Math.ceil((AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY / 100) * totalRecent);
            const needCorrect = Math.max(0, targetCorrect - currentCorrect);
            message = `📈 Almost there! Need ${pointsNeeded}% more accuracy (≈${needCorrect} more correct answer${needCorrect !== 1 ? 's' : ''} in recent ${totalRecent}) to reach ${AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY}% and level up.`;
        } else if (accuracyPercentage >= 70) {
            // Making progress
            barPercentage = ((accuracyPercentage - 70) / 10) * 50; // 0-50% on bar
            barColor = '#eab308'; // Yellow
            const pointsNeeded = (AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY - accuracyPercentage).toFixed(1);
            message = `📚 Keep practicing! Need ${pointsNeeded}% more accuracy to reach the ${AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY}% threshold for leveling up.`;
        } else if (accuracyPercentage >= AUTO_LEVEL_CONFIG.LEVEL_DOWN_ACCURACY) {
            // Maintaining
            barPercentage = ((accuracyPercentage - 60) / 10) * 30; // 0-30% on bar
            barColor = '#f97316'; // Orange
            message = `⚡ Focus on accuracy. Currently at ${accuracyPercentage.toFixed(1)}% — aim for ${AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY}% to level up. Take your time with each challenge!`;
        } else {
            // Struggling - might level down
            barPercentage = (accuracyPercentage / AUTO_LEVEL_CONFIG.LEVEL_DOWN_ACCURACY) * 20; // 0-20% on bar
            barColor = '#ef4444'; // Red
            if (autoLevelEnabled && currentLevel > LEVEL_LIMITS.MIN) {
                const pointsToStable = (AUTO_LEVEL_CONFIG.LEVEL_DOWN_ACCURACY - accuracyPercentage).toFixed(1);
                message = `⚠️ Below ${AUTO_LEVEL_CONFIG.LEVEL_DOWN_ACCURACY}% accuracy threshold. Need ${pointsToStable}% improvement to avoid dropping to Level ${currentLevel - 1}.`;
            } else {
                message = `💪 Take your time and focus (currently ${accuracyPercentage.toFixed(1)}%). Every challenge helps you improve! Aim for ${AUTO_LEVEL_CONFIG.LEVEL_UP_ACCURACY}% to advance.`;
            }
        }
        
        progressBarFill.style.width = `${barPercentage}%`;
        progressBarFill.style.backgroundColor = barColor;
        progressMessage.textContent = message;
        progressMessage.className = 'mt-progress-message';
    }

    /**
     * Render the difficulty display for the current challenge
     * Shows a color bar, numeric value, and text label
     * @private
     */
    renderDifficultyDisplay() {
        const display = this.domCache.query('#difficulty-display');
        const bar = this.domCache.query('#difficulty-bar');
        const number = this.domCache.query('#difficulty-number');
        const label = this.domCache.query('#difficulty-label');
        
        if (!display || !this.currentChallenge) {
            display?.classList.add('hidden');
            return;
        }
        
        // Show the display
        display.classList.remove('hidden');
        
        // Update bar width (difficulty is 1-10)
        const percentage = (this.lastChallengeDifficulty / 10) * 100;
        if (bar) bar.style.width = percentage + '%';
        
        // Update color
        const color = this._getDifficultyColor(this.lastChallengeDifficulty);
        if (bar) bar.style.backgroundColor = color;
        
        // Update number and label
        if (number) number.textContent = `${Math.round(this.lastChallengeDifficulty)}/10`;
        if (label) label.textContent = this._getDifficultyLabelForChallenge(this.lastChallengeDifficulty);
    }

    /**
     * Update weak character emphasis feedback
     * Shows which weak characters are being emphasized this session
     * @private
     */
    updateWeakCharacterFeedback() {
        // Ensure sessionMetrics exists
        if (!this.stateManager.stats.sessionMetrics) {
            this.stateManager.stats.sessionMetrics = { challengesInSession: 0, lastSessionDate: null, weakCharsFocused: [], sessionStartAccuracy: {} };
        }
        const weakChars = this.stateManager.stats.sessionMetrics.weakCharsFocused || [];
        if (weakChars.length > 0 && this.sessionChallengesCount >= 3) {
            // Only show after a few challenges to avoid showing immediately
            this.dom.displays.weakCharFeedback.classList.remove('hidden');
            this.dom.displays.weakCharList.textContent = weakChars.join(', ');
        } else {
            this.dom.displays.weakCharFeedback.classList.add('hidden');
        }
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
            const accuracyPercentage = new AccuracyTracker(this.stateManager.stats.accuracy).getOverallAccuracy();
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

        this.renderSessionSummary();

        // Render character mastery breakdown
        this.renderCharacterBreakdown();
    }

    /**
     * Render session summary with improvements
     * @private
     */
    renderSessionSummary() {
        const sessionCard = this.domCache.query('#session-summary-card');
        const sessionTitle = this.domCache.query('#session-summary-title');
        const sessionChallenges = this.domCache.query('#session-challenges');
        const improvementsList = this.domCache.query('#session-improvements');
        const weakCharsDiv = this.domCache.query('#session-weak-chars');
        const weakList = this.domCache.query('#session-weak-list');

        if (!sessionCard) return;

        // Ensure sessionMetrics exists
        if (!this.stateManager.stats.sessionMetrics) {
            this.stateManager.stats.sessionMetrics = { challengesInSession: 0, lastSessionDate: null, weakCharsFocused: [], sessionStartAccuracy: {} };
        }
        
        const sessionMetrics = this.stateManager.stats.sessionMetrics;
        const challengesCount = sessionMetrics.challengesInSession || 0;

        if (challengesCount === 0) {
            sessionCard.classList.add('hidden');
            return;
        }

        sessionCard.classList.remove('hidden');
        
        // Update label: "Previous Session" if showing cached data, "This Session" if showing current session
        if (sessionTitle) {
            sessionTitle.textContent = this.sessionChallengesCount === 0 ? '📊 Previous Session' : '📊 This Session';
        }
        
        if (sessionChallenges) sessionChallenges.textContent = challengesCount;

        // Show weak chars focused
        const weakChars = sessionMetrics.weakCharsFocused || [];
        if (weakChars.length > 0 && weakCharsDiv && weakList) {
            weakCharsDiv.classList.remove('hidden');
            weakList.textContent = weakChars.join(', ');
        } else if (weakCharsDiv) {
            weakCharsDiv.classList.add('hidden');
        }

        // Calculate improvements
        if (improvementsList) {
            const startAccuracy = sessionMetrics.sessionStartAccuracy || {};
            const improvements = [];

            Object.keys(this.stateManager.stats.accuracy).forEach(char => {
                const stats = this.stateManager.stats.accuracy[char];
                if (stats.total === 0) return;

                const currentAcc = (stats.correct / stats.total) * 100;
                const startAcc = (startAccuracy[char] || 0) * 100;
                const improvement = currentAcc - startAcc;

                // Show significant improvements (at least 5% or new character)
                if (improvement >= 5 || (startAcc === 0 && currentAcc > 0)) {
                    improvements.push({
                        char,
                        improvement,
                        currentAcc,
                        isNew: startAcc === 0
                    });
                }
            });

            // Sort by improvement
            improvements.sort((a, b) => b.improvement - a.improvement);

            if (improvements.length > 0) {
                const fragment = document.createDocumentFragment();
                const title = document.createElement('p');
                title.className = 'mt-label';
                title.textContent = 'Improvements:';
                fragment.appendChild(title);

                improvements.slice(0, 5).forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'mt-improvement-item';
                    const emoji = item.isNew ? '🆕' : '📈';
                    const improvementText = item.isNew 
                        ? `${item.char}: ${Math.round(item.currentAcc)}% (new!)` 
                        : `${item.char}: +${Math.round(item.improvement)}% → ${Math.round(item.currentAcc)}%`;
                    div.textContent = `${emoji} ${improvementText}`;
                    fragment.appendChild(div);
                });

                improvementsList.innerHTML = '';
                improvementsList.appendChild(fragment);
            } else {
                improvementsList.innerHTML = '<p class="mt-text-muted" style="font-size: 0.9rem;">Keep practicing to see improvements!</p>';
            }
        }
    }

    /**
     * Render per-character mastery breakdown with progress bars and tiers
     * @private
     */
    renderCharacterBreakdown() {
        const container = this.domCache.query('#character-breakdown');
        if (!container) return;

        const tracker = this.accuracyTracker;
        const allChars = KOCH_SEQUENCE;
        const weakChars = tracker.getWeakCharacters();

        // Create mastery tier mapping function
        const getMasteryTier = (accuracy, attempts) => {
            if (attempts === 0) return { tier: 'Untouched', icon: '○', color: '#9ca3af', level: 0 };
            if (accuracy < 30) return { tier: 'Beginner', icon: '★✩✩✩✩', color: '#ef4444', level: 1 };
            if (accuracy < 60) return { tier: 'Learning', icon: '★★✩✩✩', color: '#f97316', level: 2 };
            if (accuracy < 75) return { tier: 'Proficient', icon: '★★★✩✩', color: '#eab308', level: 3 };
            if (accuracy < 90) return { tier: 'Expert', icon: '★★★★✩', color: '#84cc16', level: 4 };
            return { tier: 'Master', icon: '★★★★★', color: '#10b981', level: 5 };
        };

        const fragment = document.createDocumentFragment();

        allChars.forEach((char) => {
            const stats = tracker.getCharacterStats(char);
            const accuracy = tracker.getAccuracy(char);
            const attempts = stats ? stats.total : 0;
            const mastery = getMasteryTier(accuracy, attempts);
            const isWeak = weakChars.includes(char);

            // Create character card
            const card = document.createElement('div');
            card.className = `mt-char-card ${isWeak ? 'mt-char-weak' : ''}`;
            card.setAttribute('data-action', `char:${char}`);
            card.style.borderLeftColor = mastery.color;
            card.style.cursor = 'pointer';
            card.title = `Click to view details for ${char}`;

            let html = `<div class="mt-char-header">
                <span class="mt-char-letter">${char}</span>
                <span class="mt-char-tier" style="color: ${mastery.color};">${mastery.icon}</span>
            </div>
            <div class="mt-char-stats">
                <span class="mt-char-accuracy">${accuracy}%</span>
                <span class="mt-char-attempts">${attempts} reps</span>
            </div>`;

            if (isWeak) {
                html += `<div class="mt-char-warning">⚠️ Weak - needs practice</div>`;
            }

            card.innerHTML = html;
            fragment.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    /**
     * Show detailed mastery information for a character
     * @param {string} char - The character to show details for
     * @private
     */
    showCharacterDetail(char) {
        const tracker = this.accuracyTracker;
        const stats = tracker.getCharacterStats(char);
        const accuracy = tracker.getAccuracy(char);
        const attempts = stats ? stats.total : 0;
        const correct = stats ? stats.correct : 0;
        const incorrect = stats ? stats.incorrect : 0;

        // Determine mastery tier
        const getMasteryTier = (accuracy, attempts) => {
            if (attempts === 0) return { tier: 'Untouched', icon: '○', description: 'New character - no practice yet' };
            if (accuracy < 30) return { tier: 'Beginner', icon: '★✩✩✩✩', description: 'Just starting - needs more practice' };
            if (accuracy < 60) return { tier: 'Learning', icon: '★★✩✩✩', description: 'Making progress - keep practicing' };
            if (accuracy < 75) return { tier: 'Proficient', icon: '★★★✩✩', description: 'Solid foundation - good progress!' };
            if (accuracy < 90) return { tier: 'Expert', icon: '★★★★✩', description: 'Excellent - nearly mastered!' };
            return { tier: 'Master', icon: '★★★★★', description: 'Expert level - fully mastered!' };
        };

        const mastery = getMasteryTier(accuracy, attempts);

        // Generate advice
        let advice = '';
        if (attempts === 0) {
            advice = '💡 Practice this character to get started!';
        } else if (accuracy < 60) {
            advice = `⚠️ Accuracy is low (${accuracy}%). Practice this character more to improve.`;
        } else if (accuracy < 75) {
            advice = `📈 Good progress! Continue practicing ${char} to reach expert level.`;
        } else if (accuracy < 90) {
            advice = `🎯 Almost there! Just a bit more practice to master ${char}.`;
        } else {
            advice = `🎉 Excellent! You've mastered ${char}. Keep reinforcing!`;
        }

        // Update modal content
        this.container.querySelector('#char-detail-name').textContent = `Character: ${char}`;
        this.container.querySelector('#char-detail-tier').innerHTML = `<span style="font-size: 1.2em;">${mastery.icon}</span> ${mastery.tier}`;
        this.container.querySelector('#char-detail-accuracy').textContent = `${accuracy}%`;
        this.container.querySelector('#char-detail-attempts').textContent = attempts;
        this.container.querySelector('#char-detail-correct').textContent = correct;
        this.container.querySelector('#char-detail-incorrect').textContent = incorrect;
        this.container.querySelector('#char-detail-advice').innerHTML = `<p>${advice}</p><p style="font-size: 0.9em; color: #666;">${mastery.description}</p>`;

        // Show modal
        this.toggleModal('characterDetail', true);
    }

    /**
     * Get the difficulty preset label for display
     * @param {number} preference - Difficulty preference (1-5)
     * @returns {string} Label like "Medium", "Hard", etc.
     * @private
     */
    _getDifficultyLabel(preference) {
        const preset = DIFFICULTY_PRESETS[preference];
        return preset ? preset.name : 'Medium';
    }

    /**
     * Get the learning speed preset description for display
     * @param {number} preference - Difficulty preference (1-5)
     * @returns {string} Description of the preset
     * @private
     */
    _getDifficultyDescription(preference) {
        const preset = DIFFICULTY_PRESETS[preference];
        return preset ? preset.description : 'Balanced progression. Recommended for most learners.';
    }
}