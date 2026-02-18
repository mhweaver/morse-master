/**
 * MorseMaster - Modular Trainer Logic
 * Encapsulated ES Module for easy embedding.
 */

// --- Constants & Data ---
const MORSE_LIB = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----', '/': '-..-.', '?': '..--..', '.': '.-.-.-',
    ',': '--..'
};

const KOCH_SEQUENCE = "KMRSUAPTLOWI.NJEF0Y,VG5/Q9ZH38B?427C1D6X".split('');

const COMMON_ABBR = [
    { code: "CQ", meaning: "Calling any station" }, { code: "DE", meaning: "From" }, { code: "RST", meaning: "Signal report" },
    { code: "QTH", meaning: "Location" }, { code: "OP", meaning: "Operator" }, { code: "HW", meaning: "How copy?" },
    { code: "BK", meaning: "Back / Break" }, { code: "SK", meaning: "End of contact" }, { code: "TU", meaning: "Thank you" },
    { code: "73", meaning: "Best regards" }, { code: "GA", meaning: "Go ahead" }, { code: "GM", meaning: "Good morning" },
    { code: "GN", meaning: "Good night" }, { code: "UR", meaning: "Your / You are" }, { code: "WX", meaning: "Weather" },
    { code: "FB", meaning: "Fine Business (Good)" }, { code: "OM", meaning: "Old Man (Friend)" }, { code: "YL", meaning: "Young Lady" },
    { code: "XYL", meaning: "Wife" }, { code: "RIG", meaning: "Radio equipment" }, { code: "ANT", meaning: "Antenna" },
    { code: "HR", meaning: "Here" }, { code: "ES", meaning: "And" }, { code: "FER", meaning: "For" }
];

const Q_CODES = [
    { code: "QRL", meaning: "Are you busy?" }, { code: "QRM", meaning: "Interference" }, { code: "QRN", meaning: "Static" },
    { code: "QRO", meaning: "Increase power" }, { code: "QRP", meaning: "Low power" }, { code: "QRQ", meaning: "Send faster" },
    { code: "QRS", meaning: "Send slower" }, { code: "QRT", meaning: "Stop sending" }, { code: "QRV", meaning: "I am ready" },
    { code: "QRZ", meaning: "Who is calling?" }, { code: "QSB", meaning: "Fading signal" }, { code: "QSL", meaning: "Acknowledged" },
    { code: "QSY", meaning: "Change freq" }, { code: "QRL?", meaning: "Are you busy?" }, { code: "QRV?", meaning: "Are you ready?" },
    { code: "QTH?", meaning: "Location?" }
];

const PHRASES = [
    "TNX FER CALL", "MY NAME IS", "UR RST IS 5NN", "QTH IS NEW YORK", "FB OM TU 73", "QRZ DE K1ABC",
    "WX HR IS SUNNY", "RIG HR IS QRP", "HW CPY? BK", "GM OM GA", "NAME?", "QTH?", "RST?", "RIG?",
    "AGE?", "CALL?", "K1ABC/P", "W1AW/3", "FREQ?", "QSL?", "R.I.P.", "U.S.A.", "JAN.", "FEB.",
    "A, B, C", "1, 2, 3", "NOW, LATER"
];

const DICTIONARY = [
    "US", "SUM", "AS", "ASK", "ARK", "ARM", "RAM", "AM", "MAP", "SAP", "SUP", "UP", "PAPA", "SPAM", "PUMP",
    "AT", "MAT", "PAT", "TAP", "SAT", "RAT", "PART", "TRAP", "STAR", "START", "TART", "PUT", "RUT", "MUST",
    "TRUST", "PAST", "MAST", "ALL", "TALL", "PAL", "LAP", "SLAP", "LULL", "PULL", "PLUM", "SLUM", "ALARM",
    "ALTAR", "SALT", "POT", "TOP", "LOT", "ROT", "TO", "SO", "OR", "OUR", "OUT", "LOOP", "TOOL", "POOL",
    "ROOT", "MOP", "POP", "SOP", "LOOT", "TROOP", "MOTOR", "ROTOR", "SOLO", "TOTAL", "POOR", "TOUR", "LOW",
    "ROW", "TOW", "BOW", "SOW", "MOW", "PAW", "LAW", "SAW", "RAW", "WAR", "WAS", "WOOL", "SLOW", "FLOW",
    "BLOW", "GLOW", "WAIT", "WALL", "WILL", "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ANY", "CAN",
    "HAD", "HER", "ONE", "DAY", "GET", "HAS", "HIM", "RADIO", "POWER", "SIGNAL", "HAM", "KEY", "MORSE", "TIME", "WORD", "NAME"
];

// --- Icons (Inline SVG to avoid external deps) ---
const ICONS = {
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
    stop: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    skip: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    ai: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`,
    check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    x: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

// --- Class ---
export class MorseTrainer {
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
                                <label>Char Speed <span id="display-wpm">20 WPM</span></label>
                                <input type="range" id="input-wpm" min="15" max="45" data-action="setting:wpm">
                            </div>
                            <div class="mt-form-group">
                                <label>Effective Speed <span id="display-farnsworth">12 WPM</span></label>
                                <input type="range" id="input-farnsworth" min="5" max="45" data-action="setting:farnsworth">
                            </div>
                            <div class="mt-form-group">
                                <label>Tone Frequency <span id="display-frequency">600 Hz</span></label>
                                <input type="range" id="input-frequency" min="300" max="1200" step="50" data-action="setting:frequency">
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

    loadSettings() {
        const def = { wpm: 20, farnsworthWpm: 12, frequency: 600, volume: 0.5, lessonLevel: 2, autoLevel: true, autoPlay: true, apiKey: '', manualChars: [] };
        try { return JSON.parse(localStorage.getItem('morse-settings-v3')) || def; } catch { return def; }
    }

    saveSettings() { localStorage.setItem('morse-settings-v3', JSON.stringify(this.state.settings)); }
    
    loadStats() {
        const def = { history: [], accuracy: {} };
        try { return JSON.parse(localStorage.getItem('morse-stats-v2')) || def; } catch { return def; }
    }
    
    saveStats() { localStorage.setItem('morse-stats-v2', JSON.stringify(this.state.stats)); }

    getAudioContext() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return this.audioCtx;
    }

    stopPlayback() {
        if (this.playbackTimeout) { clearTimeout(this.playbackTimeout); this.playbackTimeout = null; }
        if (this.sessionGain) {
            const now = this.audioCtx.currentTime;
            this.sessionGain.gain.cancelScheduledValues(now);
            this.sessionGain.gain.linearRampToValueAtTime(0, now + 0.05);
            const sg = this.sessionGain;
            setTimeout(() => sg.disconnect(), 60);
            this.sessionGain = null;
        }
        this.state.isPlaying = false;
        this.renderPlayButton();
        this.renderSubmitButton();
    }

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

        let currentTime = ctx.currentTime + 0.1;
        const dotTime = 1.2 / this.state.settings.wpm;
        const dashTime = dotTime * 3;
        const fRatio = 1.2 / this.state.settings.farnsworthWpm;
        const charSpace = fRatio * 3;
        const wordSpace = fRatio * 7;

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
                gain.gain.linearRampToValueAtTime(this.state.settings.volume, currentTime + 0.005);
                gain.gain.setValueAtTime(this.state.settings.volume, currentTime + d - 0.005);
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
    togglePlay() { this.state.isPlaying ? this.stopPlayback() : this.playMorse(this.state.currentChallenge); }

    getUnlockedSet() {
        const levelChars = KOCH_SEQUENCE.slice(0, this.state.settings.lessonLevel);
        return new Set([...levelChars, ...this.state.settings.manualChars]);
    }

    getFilteredPool() {
        const unlocked = this.getUnlockedSet();
        const f = (list) => list.filter(item => {
            const txt = item.code || item;
            return txt.split('').every(c => unlocked.has(c) || c === ' ');
        });
        return { words: f(DICTIONARY), abbrs: f(COMMON_ABBR), qcodes: f(Q_CODES), phrases: f(PHRASES) };
    }

    generateNextChallenge(playNow = true) {
        this.stopPlayback();
        this.dom.displays.aiTipContainer.classList.add('hidden');
        
        const unlockedSet = this.getUnlockedSet();
        const unlockedArray = Array.from(unlockedSet);
        const pool = this.getFilteredPool();
        
        const hasContent = (pool.words.length + pool.abbrs.length + pool.qcodes.length + pool.phrases.length) > 0;
        const useContent = hasContent && Math.random() < 0.7;

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
            const numGroups = Math.floor(Math.random() * 2) + 2;
            for(let g=0; g<numGroups; g++) {
                let s = '';
                const len = Math.floor(Math.random() * 4) + 1;
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
        this.state.stats.history = this.state.stats.history.slice(0, 100);
        this.saveStats();

        const fb = this.dom.displays.feedback;
        fb.classList.remove('hidden', 'success', 'error'); // CSS classes instead of utility classes for modularity
        
        if (isCorrect) {
            fb.classList.add('success');
            fb.textContent = `Correct!${this.state.currentMeaning ? ` (${this.state.currentMeaning})` : ''}`;
            if (this.state.activeTab === 'train') {
                const delay = this.state.settings.autoPlay ? 1200 : 0;
                if (this.state.settings.autoPlay) setTimeout(() => this.generateNextChallenge(true), delay);
                else this.generateNextChallenge(false); // Prep next but wait
            }
            this.checkAutoLevel();
        } else {
            fb.classList.add('error');
            fb.textContent = `You: ${guess || 'EMPTY'} | Answer: ${correct}${this.state.currentMeaning ? ` (${this.state.currentMeaning})` : ''}`;
        }
    }

    checkAutoLevel() {
        if (!this.state.settings.autoLevel) return;
        const h = this.state.stats.history;
        if (h.length < 15) return;
        const rec = h.slice(0, 20);
        const acc = (rec.filter(x => x.correct).length / rec.length) * 100;

        if (acc >= 90 && this.state.settings.lessonLevel < KOCH_SEQUENCE.length) this.changeLevel(1);
        else if (acc < 60 && this.state.settings.lessonLevel > 2) this.changeLevel(-1);
    }

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

    changeLevel(delta) {
        let newLevel = this.state.settings.lessonLevel + delta;
        if (delta > 0) {
            while (newLevel < KOCH_SEQUENCE.length) {
                if (!this.state.settings.manualChars.includes(KOCH_SEQUENCE[newLevel - 1])) break;
                newLevel++;
            }
        }
        newLevel = Math.max(2, Math.min(KOCH_SEQUENCE.length, newLevel));
        if (newLevel !== this.state.settings.lessonLevel) {
            this.state.settings.lessonLevel = newLevel;
            this.saveSettings();
            this.renderKochGrid();
        }
    }

    // --- AI / Offline Simulation ---
    async generateAIBroadcast() {
        this.stopPlayback();
        const fb = this.dom.displays.feedback;
        fb.classList.remove('hidden', 'error', 'success');
        fb.classList.add('info');
        fb.textContent = "Intercepting signal...";

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
                    this.state.currentMeaning = "Simulated Broadcast";
                } else {
                    this.generateNextChallenge(false);
                    this.state.currentMeaning = "Weak Signal (Synthetic)";
                }
                
                this.dom.inputs.user.value = '';
                fb.classList.add('hidden');
                this.playMorse(this.state.currentChallenge);
            }, 800);
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
                const prompt = `Generate a short sentence (5-10 words). Constraints: Use ONLY these characters: [${Array.from(this.getUnlockedSet()).join(', ')}]. Output UPPERCASE text only, no punctuation.`;
                const result = await session.prompt(prompt);
                session.destroy(); // Clean up session
                
                // Parse and validate the result
                const text = result.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
                const unlockedSet = this.getUnlockedSet();
                const validText = text.split('').every(c => c === ' ' || unlockedSet.has(c));
                
                if (validText && text.trim()) {
                    this.state.currentChallenge = text.trim();
                    this.state.currentMeaning = "AI Broadcast";
                    this.dom.inputs.user.value = '';
                    fb.classList.add('hidden');
                    this.playMorse(this.state.currentChallenge);
                } else {
                    // Fallback to offline if AI response isn't valid
                    throw new Error('Invalid AI response');
                }
            } catch (e) {
                console.log('Browser AI generation failed:', e.message);
                // Fallback to offline simulation
                fb.textContent = "AI failed, using fallback...";
                setTimeout(() => this.generateAIBroadcast(), 100);
                this.state.hasBrowserAI = false;
            }
        }
    }
    
    async generateAICoach() {
        // Similar fallback logic as broadcast
        this.stopPlayback();
        const fb = this.dom.displays.feedback;
        fb.classList.remove('hidden');
        fb.textContent = "Consulting Coach...";
        
        if (!this.state.settings.apiKey && !this.state.hasBrowserAI) {
            setTimeout(() => {
                const weak = Object.entries(this.state.stats.accuracy).filter(([_, d]) => d.total>2 && d.correct/d.total<0.7).map(x=>x[0]);
                const pool = weak.length ? weak : Array.from(this.getUnlockedSet());
                const groups = [];
                for(let i=0; i<3; i++) {
                    let s = ''; 
                    for(let k=0; k<4; k++) s+= pool[Math.floor(Math.random()*pool.length)];
                    groups.push(s);
                }
                this.state.currentChallenge = groups.join(' ');
                this.state.currentMeaning = "Smart Coach (Offline)";
                this.dom.displays.aiTipContainer.classList.remove('hidden');
                this.dom.displays.aiTipText.textContent = weak.length ? "Focusing on weak chars." : "Good accuracy! Focusing on rhythm.";
                fb.classList.add('hidden');
                this.playMorse(this.state.currentChallenge);
            }, 800);
            return;
        }

        // Browser AI Logic
        if (this.state.hasBrowserAI) {
            try {
                const weak = Object.entries(this.state.stats.accuracy).filter(([_, d]) => d.total>2 && d.correct/d.total<0.7).map(x=>x[0]);
                let session;
                if (this.state.aiAPI === 'LanguageModel') {
                    session = await window.LanguageModel.create({ language: 'en' });
                } else {
                    session = await window.ai.languageModel.create();
                }
                const focusChars = weak.length ? weak : Array.from(this.getUnlockedSet());
                const prompt = `Generate a practice drill of 3-4 groups of random characters (4 chars each). Focus on these characters: [${focusChars.join(', ')}]. Use only characters from: [${Array.from(this.getUnlockedSet()).join(', ')}]. Output format: XXXX XXXX XXXX (uppercase, space-separated groups, no punctuation).`;
                const result = await session.prompt(prompt);
                session.destroy(); // Clean up session
                
                // Parse and validate the result
                const text = result.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
                const unlockedSet = this.getUnlockedSet();
                const validText = text.split('').every(c => c === ' ' || unlockedSet.has(c));
                
                if (validText && text) {
                    this.state.currentChallenge = text;
                    this.state.currentMeaning = "Smart Coach (AI)";
                    this.dom.displays.aiTipContainer.classList.remove('hidden');
                    this.dom.displays.aiTipText.textContent = weak.length ? "Focusing on weak chars." : "Drill generated by AI.";
                    fb.classList.add('hidden');
                    this.playMorse(this.state.currentChallenge);
                } else {
                    throw new Error('Invalid AI response');
                }
            } catch (e) {
                console.log('Browser AI coach failed:', e.message);
                // Fallback to offline simulation
                fb.textContent = "AI failed, using fallback...";
                setTimeout(() => this.generateAICoach(), 100);
                this.state.hasBrowserAI = false;
            }
        }
    }

    // --- Render Helpers ---
    toggleModal(name, show) {
        const m = this.dom.modals[name];
        if (m) m.classList.toggle('hidden', !show);
        if (name === 'settings' && !show) { this.saveSettings(); this.renderKochGrid(); }
    }

    switchTab(id) {
        this.state.activeTab = id;
        Object.values(this.dom.tabs).forEach(b => b.classList.remove('active'));
        if (this.dom.tabs[id]) this.dom.tabs[id].classList.add('active');
        
        Object.values(this.dom.views).forEach(v => v.classList.add('hidden'));
        if (id === 'train') this.dom.views.train.classList.remove('hidden');
        if (id === 'stats') { this.dom.views.stats.classList.remove('hidden'); this.renderStats(); }
        if (id === 'guide') this.dom.views.guide.classList.remove('hidden');
        
        if (id === 'train' && !this.state.currentChallenge) this.generateNextChallenge(false);
    }

    updateSetting(key, val) {
        if(key === 'apiKey') this.state.settings.apiKey = val.trim();
        else this.state.settings[key] = key === 'autoPlay' ? val : parseInt(val);
        this.renderSettings();
    }

    toggleAutoPlay(val) {
        this.state.settings.autoPlay = val;
        this.saveSettings();
    }

    confirmReset() {
        this.state.stats = { history: [], accuracy: {} };
        this.state.settings.lessonLevel = 2;
        this.state.settings.manualChars = [];
        this.saveStats();
        this.saveSettings();
        this.toggleModal('reset', false);
        this.renderStats();
        this.renderKochGrid();
    }


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

    renderPlayButton() {
        const btn = this.dom.displays.playBtn;
        const txt = this.dom.displays.playStatus;
        if (this.state.isPlaying) {
            btn.className = 'mt-play-btn stop';
            btn.innerHTML = ICONS.stop;
            txt.textContent = "Click to Stop";
        } else {
            btn.className = 'mt-play-btn play';
            btn.innerHTML = ICONS.play;
            txt.textContent = "Click to Play (Auto-Focus)";
        }
    }

    renderSubmitButton() {
        const btn = this.dom.displays.submitBtn;
        const disabled = !this.state.currentChallenge || this.state.isPlaying || !this.state.hasPlayedCurrent;
        btn.disabled = disabled;
    }

    renderKochGrid() {
        const grid = this.container.querySelector('#koch-grid');
        const badge = this.container.querySelector('#level-badge');
        if (!grid) return;

        const lvlIdx = this.state.settings.lessonLevel;
        const manual = this.state.settings.manualChars;

        grid.innerHTML = '';
        KOCH_SEQUENCE.forEach((char, idx) => {
            const btn = document.createElement('button');
            btn.className = 'mt-char-box mt-koch-btn';
            btn.textContent = char;
            btn.dataset.char = char;

            const isInLevel = idx < lvlIdx;
            const isManual = manual.includes(char);

            if (isInLevel && !isManual) btn.classList.add('unlocked');
            else if (isManual) btn.classList.add('manual');

            grid.appendChild(btn);
        });

        if (badge) badge.textContent = `Level ${lvlIdx}`;
    }

    renderGuide() {
        const roadmapList = this.container.querySelector('#roadmap-list');
        const abbrGrid = this.container.querySelector('#abbr-grid');

        if (roadmapList) {
            const chunks = [
                { end: 5, description: "Foundational" },
                { end: 12, description: "Vowels & High Freq" },
                { end: 18, description: "Punctuation & Numbers" },
                { end: 26, description: "Q-Codes" },
                { end: 40, description: "Advanced" }
            ];

            let startIdx = 0;
            roadmapList.innerHTML = '';
            
            chunks.forEach(chunk => {
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
                    roadmapList.appendChild(item);
                }
                startIdx = endIdx;
            });
        }

        if (abbrGrid) {
            abbrGrid.innerHTML = '';
            COMMON_ABBR.forEach(abbr => {
                const card = document.createElement('div');
                card.className = 'mt-abbr-card';
                card.innerHTML = `<div class="mt-abbr-code">${abbr.code}</div> <div class="mt-abbr-meaning">${abbr.meaning}</div>`;
                abbrGrid.appendChild(card);
            });
        }
    }

    renderStats() {
        const accuracyDiv = this.container.querySelector('#stat-accuracy');
        const drillsDiv = this.container.querySelector('#stat-drills');
        const historyList = this.container.querySelector('#history-list');

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
            historyList.innerHTML = '';
            this.state.stats.history.slice(0, 20).forEach((entry, idx) => {
                const item = document.createElement('div');
                item.className = 'mt-history-item ' + (entry.correct ? 'success' : 'error');
                const timeago = Math.round((Date.now() - entry.timestamp) / 1000);
                const timeStr = timeago < 60 ? timeago + 's' : (Math.round(timeago / 60) + 'm');
                item.innerHTML = `<span class="mt-history-result">${entry.correct ? '✓' : '✗'}</span> <span class="mt-history-text">${entry.challenge}</span> <span class="mt-history-time">${timeStr} ago</span>`;
                historyList.appendChild(item);
            });
        }
    }
}