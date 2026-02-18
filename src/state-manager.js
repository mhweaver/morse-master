/**
 * StateManager - Manages application state and persistence
 * Handles loading/saving settings and statistics from localStorage
 */

import { DEFAULT_SETTINGS, DEFAULT_STATS, STORAGE_KEYS, SETTINGS_RANGES } from './constants.js';
import { ErrorHandler } from './error-handler.js';

export class StateManager {
  constructor() {
    this.settings = this.loadSettings();
    this.stats = this.loadStats();
  }

  /**
   * Load saved settings from localStorage
   * @returns {Object} Settings object with wpm, frequency, level and other preferences
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
   * @public
   */
  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      ErrorHandler.logError(error, 'Saving settings to localStorage', {
        settingsKeys: Object.keys(this.settings)
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
   * @public
   */
  saveStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
    } catch (error) {
      ErrorHandler.logError(error, 'Saving stats to localStorage', {
        historyLength: this.stats.history.length,
        accuracyKeys: Object.keys(this.stats.accuracy).length
      });
    }
  }

  /**
   * Update a setting value and trigger validation
   * @param {string} key - Setting key
   * @param {any} newValue - New value
   * @returns {Object} {valid: boolean, error?: string}
   * @public
   */
  updateSetting(key, newValue) {
    // Validate specific settings
    if (key === 'wpm') {
      if (newValue < SETTINGS_RANGES.wpm.min || newValue > SETTINGS_RANGES.wpm.max) {
        return {
          valid: false,
          error: `WPM must be between ${SETTINGS_RANGES.wpm.min} and ${SETTINGS_RANGES.wpm.max}`
        };
      }
      this.settings.wpm = parseInt(newValue);
    } else if (key === 'farnsworthWpm') {
      if (newValue < SETTINGS_RANGES.farnsworthWpm.min || newValue > SETTINGS_RANGES.farnsworthWpm.max) {
        return {
          valid: false,
          error: `Farnsworth WPM must be between ${SETTINGS_RANGES.farnsworthWpm.min} and ${SETTINGS_RANGES.farnsworthWpm.max}`
        };
      }
      this.settings.farnsworthWpm = parseInt(newValue);
    } else if (key === 'frequency') {
      if (newValue < SETTINGS_RANGES.frequency.min || newValue > SETTINGS_RANGES.frequency.max) {
        return {
          valid: false,
          error: `Frequency must be between ${SETTINGS_RANGES.frequency.min} and ${SETTINGS_RANGES.frequency.max} Hz`
        };
      }
      this.settings.frequency = parseInt(newValue);
    } else if (key === 'apiKey') {
      this.settings.apiKey = newValue.trim();
    } else if (key === 'autoPlay') {
      this.settings.autoPlay = newValue;
    } else if (key === 'autoLevel') {
      this.settings.autoLevel = newValue;
    } else if (key === 'lessonLevel') {
      this.settings.lessonLevel = parseInt(newValue);
    } else if (key === 'volume') {
      this.settings.volume = parseFloat(newValue);
    }

    return { valid: true };
  }

  /**
   * Reset all progress to initial state
   * @public
   */
  reset() {
    this.stats = JSON.parse(JSON.stringify(DEFAULT_STATS));
    this.settings.lessonLevel = 2;
    this.settings.manualChars = [];
  }

  /**
   * Get a copy of settings (to prevent external mutations)
   * @returns {Object} Copy of settings
   * @public
   */
  getSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  /**
   * Get a copy of stats (to prevent external mutations)
   * @returns {Object} Copy of stats
   * @public
   */
  getStats() {
    return JSON.parse(JSON.stringify(this.stats));
  }
}
