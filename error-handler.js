/**
 * Error Handling Utilities for MorseTrainer
 * Provides consistent error reporting and user feedback
 */

export class ErrorHandler {
  /**
   * Log error with context information
   * @param {Error} error - The error object
   * @param {string} context - What was being attempted
   * @param {Object} metadata - Additional context data
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
   * Get user-friendly error message
   * @param {string} errorType - Type of error
   * @param {Object} details - Error details
   * @returns {string} User-friendly message
   */
  static getUserMessage(errorType, details = {}) {
    const messages = {
      STORAGE_LOAD: 'Failed to load saved settings. Using defaults.',
      AUDIO_CONTEXT: 'Unable to initialize audio. Some features may not work.',
      AI_UNAVAILABLE: 'AI features unavailable. Using local generation mode.',
      AI_INVALID_RESPONSE: 'AI response validation failed. Retrying...',
      INVALID_SETTING: `Invalid setting value: ${details.key || 'unknown'}`,
      DOM_NOT_FOUND: `Required DOM element not found: ${details.selector || 'unknown'}`,
      NETWORK_ERROR: 'Network error. Please check your connection.',
      TIMEOUT: 'Operation timed out. Please try again.'
    };

    return messages[errorType] || 'An unexpected error occurred.';
  }

  /**
   * Validate settings object
   * @param {Object} settings - Settings to validate
   * @returns {Object} {valid: boolean, errors: array}
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

/**\n * Wraps AI calls with proper timeout and error handling
 */
export class AICallWrapper {
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
