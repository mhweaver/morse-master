// Global test setup
import { beforeEach, afterEach, vi } from 'vitest';

// Mock Web Audio API
global.AudioContext = class AudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  get destination() {
    return { connect: vi.fn() };
  }

  async resume() {
    this.state = 'running';
  }
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

global.localStorage = localStorageMock;

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

// Clear all timers after each test
afterEach(() => {
  vi.clearAllTimers();
});
