/**
 * AudioSynthesizer - Handles Morse code audio synthesis
 * Encapsulates Web Audio API operations for generating morse code sounds
 * Supports Farnsworth timing for realistic training experience
 */

import { MORSE_LIB, AUDIO_TIMING } from './constants.js';

export class AudioSynthesizer {
  /**
   * Initialize synthesizer with audio settings
   * @param {Object} settings - Audio settings object
   * @param {number} settings.wpm - Character speed in words per minute (15-45)
   * @param {number} settings.farnsworthWpm - Farnsworth timing speed (5-45)
   * @param {number} settings.frequency - Tone frequency in Hz (300-1200)
   * @param {number} settings.volume - Volume from 0.0 to 1.0
   */
  constructor(settings = {}) {
    this.audioCtx = null;
    this.sessionGain = null;
    this.playbackTimeout = null;
    this.isPlaying = false;
    this.settings = {
      wpm: settings.wpm || 20,
      farnsworthWpm: settings.farnsworthWpm || 12,
      frequency: settings.frequency || 600,
      volume: settings.volume || 0.5
    };
  }

  /**
   * Get or create Web Audio API context
   * Lazily initializes single shared audio context for performance
   * @returns {AudioContext} The audio context instance
   * @throws {Error} If Web Audio API is not supported
   * @private
   */
  getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioCtx;
  }

  /**
   * Update audio settings and apply to future playback
   * Changes take effect on next play() call
   * @param {Object} newSettings - Partial settings object to update
   * @public
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Stop current audio playback and clean up audio resources
   * Safely terminates running audio context nodes
   * @public
   */
  stop() {
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    if (this.sessionGain) {
      const now = this.audioCtx.currentTime;
      this.sessionGain.gain.cancelScheduledValues(now);
      this.sessionGain.gain.linearRampToValueAtTime(0, now + AUDIO_TIMING.SESSION_GAIN_RAMP);
      const sg = this.sessionGain;
      setTimeout(() => sg.disconnect(), AUDIO_TIMING.SESSION_GAIN_DISCONNECT);
      this.sessionGain = null;
    }
    this.isPlaying = false;
  }

  /**
   * Play Morse code audio for given text using Web Audio API
   * Generates and plays morse code patterns using sine wave synthesis.
   * Uses Farnsworth timing: characters are sent at high speed (wpm) but 
   * spaced out at lower speed (farnsworthWpm) to aid learning.
   * 
   * If already playing, stops current playback before starting new playback.
   * @param {string} text - Text to convert to Morse code and play (e.g., "HELLO")
   * @param {Function} onComplete - Optional callback function when playback completes
   * @returns {Promise<void>} Resolves when playback setup is complete
   * @throws {Error} If audio context creation fails
   * @public
   */
  async play(text, onComplete = null) {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    if (!text) return;

    this.isPlaying = true;

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    this.sessionGain = ctx.createGain();
    this.sessionGain.connect(ctx.destination);

    let currentTime = ctx.currentTime + AUDIO_TIMING.AUDIO_START_DELAY;
    const dotTime = AUDIO_TIMING.DOT_MULTIPLIER / this.settings.wpm;
    const dashTime = dotTime * AUDIO_TIMING.DASH_MULTIPLIER;
    const fRatio = AUDIO_TIMING.DOT_MULTIPLIER / this.settings.farnsworthWpm;
    const charSpace = fRatio * AUDIO_TIMING.CHAR_SPACE_MULTIPLIER;
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
        const duration = (symbol === '.') ? dotTime : dashTime;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(this.settings.frequency, currentTime);

        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(this.settings.volume, currentTime + AUDIO_TIMING.AMPLITUDE_RAMP_UP);
        gain.gain.setValueAtTime(this.settings.volume, currentTime + duration - AUDIO_TIMING.AMPLITUDE_RAMP_DOWN);
        gain.gain.linearRampToValueAtTime(0, currentTime + duration);

        oscillator.connect(gain);
        gain.connect(this.sessionGain);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);

        currentTime += duration;
        if (j < pattern.length - 1) currentTime += dotTime;
      }
      currentTime += charSpace;
    }

    this.playbackTimeout = setTimeout(() => {
      this.isPlaying = false;
      this.sessionGain = null;
      if (onComplete) onComplete();
    }, (currentTime - ctx.currentTime) * 1000);
  }

  /**
   * Play a short celebratory jingle (3-note major triad)
   * Used when user levels up automatically
   * @param {Function} onComplete - Optional callback when jingle completes
   * @returns {Promise<void>}
   * @public
   */
  async playJingle(onComplete = null) {
    if (this.isPlaying) {
      this.stop();
      return;
    }

    this.isPlaying = true;

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    this.sessionGain = ctx.createGain();
    this.sessionGain.connect(ctx.destination);

    // Major triad notes (C, E, G) - frequencies in Hz
    const notes = [261.63, 329.63, 392.00]; // C4, E4, G4 (approximate)
    const noteDuration = 0.15; // 150ms per note
    const rampTime = 0.01; // 10ms ramp for smooth tone
    let currentTime = ctx.currentTime + AUDIO_TIMING.AUDIO_START_DELAY;

    for (const frequency of notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, currentTime);

      gain.gain.setValueAtTime(0, currentTime);
      gain.gain.linearRampToValueAtTime(this.settings.volume, currentTime + rampTime);
      gain.gain.setValueAtTime(this.settings.volume, currentTime + noteDuration - rampTime);
      gain.gain.linearRampToValueAtTime(0, currentTime + noteDuration);

      oscillator.connect(gain);
      gain.connect(this.sessionGain);
      oscillator.start(currentTime);
      oscillator.stop(currentTime + noteDuration);

      currentTime += noteDuration;
    }

    const totalDuration = currentTime - ctx.currentTime;
    this.playbackTimeout = setTimeout(() => {
      this.isPlaying = false;
      this.sessionGain = null;
      if (onComplete) onComplete();
    }, totalDuration * 1000);
  }

  /**
   * Close audio context and clean up resources
   * @public
   */
  destroy() {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
