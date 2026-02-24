/**
 * MorseMaster Constants
 * Centralized configuration and magic values to reduce duplication and improve maintainability.
 */

// --- Storage Keys ---
export const STORAGE_KEYS = {
  SETTINGS: 'morse-settings-v3',
  STATS: 'morse-stats-v2'
};

// --- Default Settings ---
export const DEFAULT_SETTINGS = {
  wpm: 20,
  farnsworthWpm: 12,
  frequency: 600,
  volume: 0.5,
  lessonLevel: 2,
  autoLevel: true,
  autoPlay: true,
  apiKey: '',
  manualChars: [],
  difficultyPreference: 3,  // 1=Very Easy, 2=Easy, 3=Medium, 4=Hard, 5=Very Hard
  userCallsign: ''  // User's personal amateur radio callsign
};

export const DEFAULT_STATS = {
  history: [],
  accuracy: {},
  sessionMetrics: {
    challengesInSession: 0,
    lastSessionDate: null,
    weakCharsFocused: [], // Phase 3: Track weak chars emphasized this session
    sessionStartAccuracy: {} // Phase 4: Track starting accuracy to show improvement
  }
};

// --- Settings Ranges ---
export const SETTINGS_RANGES = {
  wpm: { min: 15, max: 45 },
  farnsworthWpm: { min: 5, max: 45 },
  frequency: { min: 300, max: 1200, step: 50 },
  difficultyPreference: { min: 1, max: 5 }
};

// --- Audio Timing (in fractions of WPM) ---
export const AUDIO_TIMING = {
  AUDIO_START_DELAY: 0.1,      // seconds before playback starts
  AMPLITUDE_RAMP_UP: 0.005,     // seconds to fade in
  AMPLITUDE_RAMP_DOWN: 0.005,   // seconds to fade out
  SESSION_GAIN_RAMP: 0.05,      // seconds to ramp down session gain
  SESSION_GAIN_DISCONNECT: 60,  // ms to wait before disconnecting
  DOT_MULTIPLIER: 1.2,          // dot time = 1.2 / wpm
  DASH_MULTIPLIER: 3,           // dash time = dot time * 3
  char_SPACE_MULTIPLIER: 3,     // char space in Farnsworth ratio units
  WORD_SPACE_MULTIPLIER: 7      // word space in Farnsworth ratio units
};

// --- Playback Delays (in milliseconds) ---
export const PLAYBACK_DELAYS = {
  AUTO_PLAY_NEXT: 1200,         // delay before auto-playing next challenge
  AI_SIMULATION_DELAY: 800,     // delay for offline AI simulation
  AI_FALLBACK_RETRY: 100        // delay before retrying AI generation
};

// --- Koch Training ---
export const KOCH_SEQUENCE = "KMRSUAPTLOWI.NJEF0Y,VG5/Q9ZH38B?427C1D6X".split('');

export const KOCH_LEVELS = [
  { end: 5, description: "Foundational" },
  { end: 12, description: "Vowels & High Freq" },
  { end: 18, description: "Punctuation & Numbers" },
  { end: 26, description: "Q-Codes" },
  { end: 40, description: "Advanced" }
];

// --- Auto-Level Thresholds ---
export const AUTO_LEVEL_CONFIG = {
  HISTORY_WINDOW: 5,            // recent drills to evaluate
  ACCURACY_THRESHOLD: 15,       // min drills to check accuracy
  LEVEL_UP_ACCURACY: 90,        // % accuracy to level up
  LEVEL_DOWN_ACCURACY: 60       // % accuracy to level down
};

// --- Level Limits ---
export const LEVEL_LIMITS = {
  MIN: 2,
  MAX: 40  // KOCH_SEQUENCE.length
};

// --- Content Generation ---
export const CONTENT_GENERATION = {
  REAL_CONTENT_PROBABILITY: 0.7, // 70% real words, 30% synthetic
  SYNTHETIC_GROUPS: { min: 2, max: 3 }, // number of character groups
  SYNTHETIC_GROUP_LENGTH: { min: 1, max: 4 }, // characters per group
  COACH_WEAK_ACCURACY_THRESHOLD: 0.7, // accuracy below which char is "weak"
  COACH_WEAK_ATTEMPTS_THRESHOLD: 2, // min attempts to be considered "weak"
  COACH_DRILL_GROUPS: 3,         // number of groups in coach drill
  COACH_DRILL_GROUP_LENGTH: 4,   // characters per group in coach drill
  HISTORY_LIMIT: 100,            // max stored history entries
  HISTORY_DISPLAY_LIMIT: 20,     // max history items shown in UI
  ACCURACY_PRECISION: 100,       // percentage rounding base
  BATCH_SIZE: 10,                // number of challenges to generate in a batch
  BATCH_SMART_COACH_SIZE: 8      // number of smart coach challenges to generate
};

// --- UI Rendering ---
export const UI_RENDERING = {
  HISTORY_DISPLAY_LIMIT: 20,     // max history items shown in stats view
  TIME_FORMAT_THRESHOLD_SEC: 60,  // threshold before switching to minutes
  PERCENTAGE_PRECISION: 100       // multiply/divide for percent calculations
};

// --- Debouncing ---
export const DEBOUNCE_TIMING = {
  SETTINGS_SAVE: 500  // milliseconds to debounce settings save
};

// --- AI APIs ---
export const AI_APIS = {
  LANGUAGE_MODEL: 'LanguageModel',
  WINDOW_AI: 'window.ai'
};

// --- Modal Identifiers ---
export const MODAL_IDENTIFIERS = {
  SETTINGS: 'settings',
  RESET: 'reset',
  AI_HELP: 'aiHelp',
  CHARACTER_DETAIL: 'characterDetail'
};

// --- CSS Classes ---
export const CSS_CLASSES = {
  HIDDEN: 'hidden',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  UNLOCKED: 'unlocked',
  MANUAL: 'manual',
  PLAY: 'play',
  STOP: 'stop'
};

// --- UI States ---
export const UI_FEEDBACK = {
  CORRECT_MESSAGE: 'Correct!',
  INTERCEPTING: 'Intercepting signal...',
  CONSULTING: 'Consulting Coach...',
  AI_FAILED: 'AI failed, using fallback...',
  EMPTY_INPUT: 'EMPTY',
  WEAK_SIGNAL: 'Weak Signal (Synthetic)',
  SIMULATED_BROADCAST: 'Simulated Broadcast',
  AI_BROADCAST: 'AI Broadcast',
  AI_COACH: 'Smart Coach (AI)',
  OFFLINE_COACH: 'Smart Coach (Offline)',
  WEAK_CHARS_MESSAGE: 'Focusing on weak chars.',
  GOOD_ACCURACY_MESSAGE: 'Good accuracy! Focusing on rhythm.',
  DRILL_GENERATED_MESSAGE: 'Drill generated by AI.'
};

// --- AI Operations Prompts ---
export const AI_PROMPTS = {
  BROADCAST: (chars) => `Generate a short sentence (5-10 words). Constraints: Use ONLY these characters: [${chars}]. Output UPPERCASE text only, no punctuation.`,
  COACH: (focusChars, allChars) => `Generate a practice drill of 3-4 groups of random characters (4 chars each). Focus on these characters: [${focusChars}]. Use only characters from: [${allChars}]. Output format: XXXX XXXX XXXX (uppercase, space-separated groups, no punctuation).`
};

// --- Difficulty Heuristic ---
export const DIFFICULTY = {
  // Difficulty scale (1-10)
  EASY: 1,
  VERY_EASY: 2,
  MODERATE: 5,
  HARD: 8,
  VERY_HARD: 10,

  // New character ramp - reduce difficulty when new char just added
  NEW_CHAR_DIFFICULTY_GRACE: 2, // lessons to apply easier generation
  NEW_CHAR_BASE_DIFFICULTY: 2, // start new chars at this difficulty

  // Difficulty factors
  DIFFICULTY_SCALE_MIN: 1,
  DIFFICULTY_SCALE_MAX: 10,

  // Performance thresholds for adaptation
  EXCELLENT_PERFORMANCE_THRESHOLD: 0.85, // increase difficulty
  GOOD_PERFORMANCE_THRESHOLD: 0.75,      // maintain or slightly increase
  FAIR_PERFORMANCE_THRESHOLD: 0.60,      // maintain
  POOR_PERFORMANCE_THRESHOLD: 0.60,      // decrease difficulty

  // Difficulty adjustment factors
  DIFFICULTY_UP_FACTOR: 1.2,   // increase by 20% when performing well
  DIFFICULTY_DOWN_FACTOR: 0.8, // decrease by 20% when struggling
  DIFFICULTY_MAINTAIN_RANGE: 0.15, // ±15% to maintain current difficulty

  // Character accuracy influence
  WEAK_CHAR_ACCURACY_REDUCTION: -2, // reduce difficulty if weak chars present
  STRONG_CHAR_BONUS: 1, // increase difficulty if all chars >80% accuracy

  // Challenge length influence on difficulty
  SYNTHETIC_LENGTH_WEIGHT: 0.3,      // 30% of difficulty from length
  REAL_CONTENT_DIFFICULTY_BOOST: 1.5 // real words are 50% harder than synthetic
};

// --- Difficulty Presets (User-friendly difficulty slider) ---
// Maps difficultyPreference (1-5) to DIFFICULTY configuration overrides
export const DIFFICULTY_PRESETS = {
  1: { // Very Easy - Gentle learning for absolute beginners
    name: 'Very Easy',
    description: 'Gentle learning curve for absolute beginners. Extended grace period for new characters.',
    NEW_CHAR_DIFFICULTY_GRACE: 3,
    EXCELLENT_PERFORMANCE_THRESHOLD: 0.95,
    POOR_PERFORMANCE_THRESHOLD: 0.70
  },
  2: { // Easy - Beginner-friendly with generous grace period
    name: 'Easy',
    description: 'Beginner-friendly pace with forgiving thresholds. Good for casual learners.',
    NEW_CHAR_DIFFICULTY_GRACE: 2,
    EXCELLENT_PERFORMANCE_THRESHOLD: 0.90,
    POOR_PERFORMANCE_THRESHOLD: 0.65
  },
  3: { // Medium - Balanced challenge (default)
    name: 'Medium',
    description: 'Balanced challenge for steady progress. Recommended for most learners.',
    NEW_CHAR_DIFFICULTY_GRACE: 2,
    EXCELLENT_PERFORMANCE_THRESHOLD: 0.85,
    POOR_PERFORMANCE_THRESHOLD: 0.60
  },
  4: { // Hard - More challenging progression
    name: 'Hard',
    description: 'Faster progression with higher standards. For dedicated practice.',
    NEW_CHAR_DIFFICULTY_GRACE: 1,
    EXCELLENT_PERFORMANCE_THRESHOLD: 0.80,
    POOR_PERFORMANCE_THRESHOLD: 0.55
  },
  5: { // Very Hard - Contest prep, rapid advancement
    name: 'Very Hard',
    description: 'Rapid advancement for contest prep. Demands high accuracy from the start.',
    NEW_CHAR_DIFFICULTY_GRACE: 1,
    EXCELLENT_PERFORMANCE_THRESHOLD: 0.75,
    POOR_PERFORMANCE_THRESHOLD: 0.50
  }
};

// --- Morse Code Library ---
export const MORSE_LIB = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', '/': '-..-.', '?': '..--..', '.': '.-.-.-',
  ',': '--..'
};

// --- Icons (Inline SVG) ---
export const ICONS = {
  play: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  skip: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`,
  zap: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  ai: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  x: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};
