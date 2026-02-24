/**
 * Error Handling Utilities for MorseTrainer
 * Provides consistent error reporting, validation, and user feedback
 */

export class ErrorHandler {
  /**
   * Log error with context information
   * @param {Error} error - The error object
   * @param {string} context - What was being attempted (descriptive context)
   * @param {Object} metadata - Additional context data (optional)
   * @returns {Object} Logged error structure with timestamp, context, message, and metadata
   * @static
   */
  static logError(error, context = '', metadata = {}) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${context}: ${error.message}`;

    console.error(message, {
      stack: error.stack,
      ...metadata
    });

    return {
      timestamp,
      context,
      message: error.message,
      metadata
    };
  }

  /**
   * Get user-friendly error message from error type
   * Handles all known error types with helpful, non-technical descriptions
   * @param {string} errorType - Type of error (e.g., 'STORAGE_LOAD', 'AI_UNAVAILABLE')
   * @param {Object} details - Error specific details (e.g., {key: 'wpm', value: 999})
   * @returns {string} User-friendly error message
   * @static
   */
  static getUserMessage(errorType, details = {}) {
    const messages = {
      STORAGE_LOAD: 'Failed to load saved settings. Using default values.',
      STORAGE_SAVE: 'Failed to save data to browser storage. Some progress may be lost.',
      AUDIO_CONTEXT: 'Unable to initialize audio device. Audio playback may not work.',
      AI_UNAVAILABLE: 'AI service not available. Using local generation mode.',
      AI_INVALID_RESPONSE: 'AI service returned invalid data. Retrying with fallback...',
      INVALID_SETTING: `Setting '${details.key || 'unknown'}' has an invalid value: ${details.value || 'undefined'}`,
      DOM_NOT_FOUND: `Required UI element not found: ${details.selector || 'unknown'}. The interface may not render correctly.`,
      NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
      TIMEOUT: 'Operation timed out. The server may be slow. Please try again.',
      MORSE_LIB_ERROR: 'Character does not have a Morse code equivalent.',
      AI_SESSION_ERROR: 'Failed to create AI session. Error: ' + (details.message || 'unknown'),
      VALIDATE_ERROR: 'Input validation failed. Please check your input.'
    };

    return messages[errorType] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Validate settings object against acceptable ranges
   * @param {Object} settings - Settings object to validate
   * @param {Object} ranges - Validation ranges (min/max for each setting)
   * @returns {Object} {valid: boolean, errors: string[]} - Validation result with error messages
   * @static
   */
  static validateSettings(settings, ranges = {}) {
    const errors = [];

    if (settings.wpm) {
      if (ranges.wpm && (settings.wpm < ranges.wpm.min || settings.wpm > ranges.wpm.max)) {
        errors.push(`WPM out of range: ${settings.wpm} (${ranges.wpm.min}-${ranges.wpm.max})`);
      }
    }

    if (settings.farnsworthWpm) {
      if (ranges.farnsworthWpm && (settings.farnsworthWpm < ranges.farnsworthWpm.min || settings.farnsworthWpm > ranges.farnsworthWpm.max)) {
        errors.push(`Farnsworth WPM out of range: ${settings.farnsworthWpm}`);
      }
    }

    if (settings.frequency) {
      if (ranges.frequency && (settings.frequency < ranges.frequency.min || settings.frequency > ranges.frequency.max)) {
        errors.push(`Frequency out of range: ${settings.frequency} Hz`);
      }
    }

    if (settings.lessonLevel) {
      if (settings.lessonLevel < 2 || settings.lessonLevel > 40) {
        errors.push(`Invalid lesson level: ${settings.lessonLevel}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Wraps AI calls with proper timeout and error handling
 * Provides a clean interface for executing async operations with timeout protection
 */
export class AICallWrapper {
  /**
   * Execute function with timeout protection
   * @param {Function} fn - Async function to execute
   * @param {number} timeoutMs - Timeout duration in milliseconds (default 10000)
   * @param {string} context - Context description for error messages
   * @returns {Promise} Promise that resolves if fn completes before timeout
   * @throws {Error} If timeout occurs or fn rejects
   * @static
   */
  static async callWithTimeout(fn, timeoutMs = 10000, context = 'AI operation') {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${context} timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } catch (error) {
      ErrorHandler.logError(error, context);
      throw error;
    }
  }
}

