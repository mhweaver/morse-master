/**
 * AIOperations - Handles AI-powered challenge generation with fallback support
 * Manages browser AI APIs, cloud API, and offline fallbacks
 */

import { AI_APIS, PLAYBACK_DELAYS, UI_FEEDBACK } from './constants.js';
import { AICallWrapper } from './error-handler.js';

export class AIOperations {
  constructor(stateManager, contentGenerator) {
    this.stateManager = stateManager;
    this.contentGenerator = contentGenerator;
    this.hasBrowserAI = false;
    this.aiAPI = null;
    this.sessionGain = null; // Track for cleanup if needed
  }

  /**
   * Initialize and detect available AI APIs
   * @public
   */
  async initializeAI() {
    try {
      // Check for new Chrome on-device AI API
      if (window.LanguageModel && window.LanguageModel.canCreate()) {
        const canUseAI = await window.LanguageModel.canCreate();
        if (canUseAI) {
          this.hasBrowserAI = true;
          this.aiAPI = AI_APIS.LANGUAGE_MODEL;
        }
      }

      // Fallback to older API
      if (!this.hasBrowserAI && window.ai && window.ai.languageModel) {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === 'readily') {
          this.hasBrowserAI = true;
          this.aiAPI = AI_APIS.WINDOW_AI;
        }
      }
    } catch (error) {
      console.log('Browser AI initialization error:', error);
    }
  }

  /**
   * Check if AI is available
   * @returns {boolean} True if any AI method is available
   * @public
   */
  isAIAvailable() {
    return this.stateManager.settings.apiKey || this.hasBrowserAI;
  }

  /**
   * Create an AI language model session
   * Supports both old (window.ai) and new (window.LanguageModel) APIs
   * @returns {Promise<Object>} AI session object with prompt method
   * @throws {Error} If neither API is available
   * @private
   */
  async createAISession() {
    if (this.aiAPI === AI_APIS.LANGUAGE_MODEL) {
      return await window.LanguageModel.create({ language: 'en' });
    } else if (this.aiAPI === AI_APIS.WINDOW_AI) {
      return await window.ai.languageModel.create();
    }
    throw new Error('No AI API available');
  }

  /**
   * Execute AI broadcast generation with fallback
   * @param {Function} onSuccess - Callback with {challenge, meaning}
   * @param {Function} onFallback - Callback for offline fallback
   * @param {Function} onError - Callback for errors
   * @public
   */
  async generateBroadcast(onSuccess, onFallback, _onError) {
    if (!this.stateManager.settings.apiKey && !this.hasBrowserAI) {
      // Offline fallback immediately
      setTimeout(() => {
        const result = this.contentGenerator.generateOfflineBroadcast(
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );
        onFallback(result);
      }, PLAYBACK_DELAYS.AI_SIMULATION_DELAY);
      return;
    }

    // Try browser AI
    if (this.hasBrowserAI) {
      try {
        const session = await this.createAISession();
        const promptData = this.contentGenerator.getAIBroadcastPrompt(
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );
        const result = await AICallWrapper.callWithTimeout(
          () => session.prompt(promptData.prompt),
          10000,
          'AI Broadcast'
        );
        session.destroy();

        // Validate response
        const validation = this.contentGenerator.validateAIResponse(
          result,
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );

        if (validation.valid) {
          onSuccess({
            challenge: validation.cleaned,
            meaning: UI_FEEDBACK.AI_BROADCAST
          });
        } else {
          throw new Error('Invalid AI response');
        }
      } catch (error) {
        console.log('Browser AI broadcast failed:', error.message);
        this.hasBrowserAI = false;
        // Fallback to offline
        setTimeout(() => onFallback(
          this.contentGenerator.generateOfflineBroadcast(
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
          )
        ), PLAYBACK_DELAYS.AI_FALLBACK_RETRY);
      }
    }
  }

  /**
   * Execute AI coach (smart drill) generation with fallback
   * @param {Function} onSuccess - Callback with {challenge, meaning, hasWeakChars}
   * @param {Function} onFallback - Callback for offline fallback
   * @param {Function} onError - Callback for errors
   * @public
   */
  async generateCoach(onSuccess, onFallback, _onError) {
    if (!this.stateManager.settings.apiKey && !this.hasBrowserAI) {
      // Offline fallback immediately
      setTimeout(() => {
        const result = this.contentGenerator.generateOfflineCoach(
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );
        onFallback(result);
      }, PLAYBACK_DELAYS.AI_SIMULATION_DELAY);
      return;
    }

    // Try browser AI
    if (this.hasBrowserAI) {
      try {
        const promptData = this.contentGenerator.getAICoachPrompt(
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );
        const session = await this.createAISession();
        const result = await AICallWrapper.callWithTimeout(
          () => session.prompt(promptData.prompt),
          10000,
          'AI Coach'
        );
        session.destroy();

        // Validate response
        const validation = this.contentGenerator.validateAIResponse(
          result,
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );

        if (validation.valid) {
          onSuccess({
            challenge: validation.cleaned,
            meaning: UI_FEEDBACK.AI_COACH,
            hasWeakChars: promptData.hasWeakChars
          });
        } else {
          throw new Error('Invalid AI response');
        }
      } catch (error) {
        console.log('Browser AI coach failed:', error.message);
        this.hasBrowserAI = false;
        // Fallback to offline
        setTimeout(() => onFallback(
          this.contentGenerator.generateOfflineCoach(
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
          )
        ), PLAYBACK_DELAYS.AI_FALLBACK_RETRY);
      }
    }
  }

  /**
   * Generate a batch of broadcast challenges
   * @param {number} batchSize - Number of challenges to generate
   * @param {Function} onSuccess - Callback with {batch: Array, totalCount: number}
   * @param {Function} onFallback - Callback for offline fallback
   * @param {Function} onError - Callback for errors
   * @public
   */
  async generateBroadcastBatch(batchSize, onSuccess, onFallback, _onError) {
    if (!this.stateManager.settings.apiKey && !this.hasBrowserAI) {
      // Offline fallback
      setTimeout(() => {
        const batch = this.contentGenerator.generateBroadcastBatch(
          batchSize,
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );
        onFallback({ batch, totalCount: batch.length });
      }, PLAYBACK_DELAYS.AI_SIMULATION_DELAY);
      return;
    }

    // Try browser AI - generate multiple challenges
    if (this.hasBrowserAI) {
      try {
        const session = await this.createAISession();
        const batch = [];

        for (let i = 0; i < batchSize; i++) {
          const promptData = this.contentGenerator.getAIBroadcastPrompt(
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
          );
          const result = await AICallWrapper.callWithTimeout(
            () => session.prompt(promptData.prompt),
            10000,
            `AI Broadcast ${i + 1}/${batchSize}`
          );

          const validation = this.contentGenerator.validateAIResponse(
            result,
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
          );

          if (validation.valid) {
            batch.push({
              challenge: validation.cleaned,
              meaning: UI_FEEDBACK.AI_BROADCAST
            });
          }
        }

        session.destroy();

        if (batch.length > 0) {
          onSuccess({ batch, totalCount: batch.length });
        } else {
          throw new Error('No valid AI responses generated');
        }
      } catch (error) {
        console.log('Browser AI broadcast batch failed:', error.message);
        this.hasBrowserAI = false;
        // Fallback to offline
        setTimeout(() => {
          const batch = this.contentGenerator.generateBroadcastBatch(
            batchSize,
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
          );
          onFallback({ batch, totalCount: batch.length });
        }, PLAYBACK_DELAYS.AI_FALLBACK_RETRY);
      }
    }
  }

  /**
   * Generate a batch of smart coach challenges
   * @param {number} batchSize - Number of challenges to generate
   * @param {Function} onSuccess - Callback with {batch: Array, hasWeakChars: boolean, totalCount: number}
   * @param {Function} onFallback - Callback for offline fallback
   * @param {Function} onError - Callback for errors
   * @public
   */
  async generateCoachBatch(batchSize, onSuccess, onFallback, _onError) {
    if (!this.stateManager.settings.apiKey && !this.hasBrowserAI) {
      // Offline fallback
      setTimeout(() => {
        const { batch, hasWeakChars } = this.contentGenerator.generateCoachBatch(
          batchSize,
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );
        onFallback({ batch, hasWeakChars, totalCount: batch.length });
      }, PLAYBACK_DELAYS.AI_SIMULATION_DELAY);
      return;
    }

    // Try browser AI - generate multiple coach challenges
    if (this.hasBrowserAI) {
      try {
        const promptData = this.contentGenerator.getAICoachPrompt(
          this.stateManager.settings.lessonLevel,
          this.stateManager.settings.manualChars
        );
        const session = await this.createAISession();
        const batch = [];

        for (let i = 0; i < batchSize; i++) {
          const result = await AICallWrapper.callWithTimeout(
            () => session.prompt(promptData.prompt),
            10000,
            `AI Coach ${i + 1}/${batchSize}`
          );

          const validation = this.contentGenerator.validateAIResponse(
            result,
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
          );

          if (validation.valid) {
            batch.push({
              challenge: validation.cleaned,
              meaning: UI_FEEDBACK.AI_COACH
            });
          }
        }

        session.destroy();

        if (batch.length > 0) {
          onSuccess({ batch, hasWeakChars: promptData.hasWeakChars, totalCount: batch.length });
        } else {
          throw new Error('No valid AI coach responses generated');
        }
      } catch (error) {
        console.log('Browser AI coach batch failed:', error.message);
        this.hasBrowserAI = false;
        // Fallback to offline
        setTimeout(() => {
          const { batch, hasWeakChars } = this.contentGenerator.generateCoachBatch(
            batchSize,
            this.stateManager.settings.lessonLevel,
            this.stateManager.settings.manualChars
          );
          onFallback({ batch, hasWeakChars, totalCount: batch.length });
        }, PLAYBACK_DELAYS.AI_FALLBACK_RETRY);
      }
    }
  }
}
