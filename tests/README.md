# MorseMaster - Test Suite Documentation

## Overview

This project includes comprehensive automated tests covering all functionality and UI behavior of the Morse code trainer application.

## Test Coverage

### 1. **Core Functionality Tests** (`tests/morse-trainer.test.js`)
Tests all business logic, data processing, and audio generation:

- ✅ Initialization and configuration
- ✅ Settings management (save/load/update)
- ✅ Stats management and persistence
- ✅ Koch level management
- ✅ Challenge generation (words, abbreviations, Q-codes, phrases, synthetic)
- ✅ Answer checking and validation
- ✅ Auto-level progression based on accuracy
- ✅ Audio generation and playback control
- ✅ AutoPlay toggle functionality
- ✅ AI operations (offline mode)
- ✅ Modal management

### 2. **UI Rendering and Behavior Tests** (`tests/morse-trainer-ui.test.js`)
Tests DOM manipulation, event handlers, and user interactions:

- ✅ Initial DOM structure rendering
- ✅ Tab navigation (Train, Stats, Guide)
- ✅ Modal interactions (Settings, Reset, AI Help)
- ✅ Play/Stop button rendering
- ✅ Submit button state management
- ✅ Koch grid rendering and character selection
- ✅ Settings display and updates
- ✅ Stats rendering (accuracy, drills, history)
- ✅ Guide content rendering (roadmap, abbreviations)
- ✅ Event handling (clicks, keyboard shortcuts, input changes)
- ✅ Feedback display (success/error messages)
- ✅ AI tip display
- ✅ Responsive UI updates

### 3. **Integration Tests** (`tests/integration.test.js`)
Tests complete user workflows and feature interactions:

- ✅ Complete training workflow (generate → play → answer → feedback)
- ✅ Level progression workflow (auto-level up/down)
- ✅ Settings persistence across sessions
- ✅ Tab navigation state preservation
- ✅ Keyboard-only workflow
- ✅ Manual character selection workflow
- ✅ AI operations workflow
- ✅ Settings modal workflow
- ✅ History tracking workflow
- ✅ Skip word functionality
- ✅ Complete user journey (multi-drill session)
- ✅ Error handling and edge cases

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test
```

### Run Tests with UI

```bash
npm run test:ui
```

This opens an interactive UI where you can:
- Browse and run individual tests
- See detailed test reports
- Debug failing tests
- View coverage reports

### Run Tests Once (CI Mode)

```bash
npm run test:run
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage reports are generated in:
- `coverage/index.html` - Visual HTML report
- `coverage/coverage-final.json` - JSON report
- Console output - Text summary

## Test Structure

```
morse-master/
├── tests/
│   ├── setup.js                    # Global test setup (mocks, etc.)
│   ├── morse-trainer.test.js       # Core functionality tests
│   ├── morse-trainer-ui.test.js    # UI rendering and behavior tests
│   └── integration.test.js         # Integration and workflow tests
├── vitest.config.js                # Vitest configuration
└── package.json                    # Test scripts and dependencies
```

## Testing Framework

- **Vitest** - Fast, modern test runner with Vite integration
- **@testing-library/dom** - DOM testing utilities
- **happy-dom** - Lightweight DOM implementation for tests
- **@vitest/ui** - Interactive test UI
- **@vitest/coverage-v8** - Code coverage reporting

## Mocked APIs

The test setup (`tests/setup.js`) provides mocks for:

- **Web Audio API** - Mocks AudioContext, oscillators, and gain nodes
- **localStorage** - In-memory storage implementation
- **Timer functions** - Controlled via `vi.useFakeTimers()`

## Key Testing Patterns

### 1. Test Isolation
Each test has a fresh DOM container and MorseTrainer instance:

```javascript
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  trainer = new MorseTrainer(container);
});

afterEach(() => {
  document.body.removeChild(container);
  vi.clearAllTimers();
});
```

### 2. Event Simulation
Tests use `fireEvent` from Testing Library:

```javascript
const button = container.querySelector('[data-action="checkAnswer"]');
fireEvent.click(button);
```

### 3. Async Operations
Tests use `vi.useFakeTimers()` for controlled timing:

```javascript
vi.useFakeTimers();
trainer.generateNextChallenge();
vi.advanceTimersByTime(900);
vi.useRealTimers();
```

### 4. State Verification
Tests verify both internal state and DOM updates:

```javascript
expect(trainer.state.isPlaying).toBe(true);
expect(trainer.dom.displays.playBtn.classList.contains('stop')).toBe(true);
```

## Coverage Goals

Target coverage metrics:
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Continuous Integration

Tests are designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage
  run: npm run test:coverage
```

## Debugging Tests

### Run Specific Test File
```bash
npx vitest tests/morse-trainer.test.js
```

### Run Specific Test
```bash
npx vitest -t "should check answer correctly"
```

### Debug with UI
```bash
npm run test:ui
```

### View Coverage Gaps
```bash
npm run test:coverage
open coverage/index.html
```

## Writing New Tests

### Test Template
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MorseTrainer } from '../morse-trainer.js';

describe('Feature Name', () => {
  let container;
  let trainer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    trainer = new MorseTrainer(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should do something', () => {
    // Arrange
    trainer.state.someValue = 'test';
    
    // Act
    trainer.someMethod();
    
    // Assert
    expect(trainer.state.someValue).toBe('expected');
  });
});
```

## Common Test Utilities

### Get DOM Elements
```javascript
const button = container.querySelector('#button-id');
const buttons = container.querySelectorAll('.button-class');
```

### Simulate User Input
```javascript
trainer.dom.inputs.user.value = 'test';
fireEvent.input(trainer.dom.inputs.user);
```

### Simulate Keyboard Events
```javascript
fireEvent.keyDown(element, { key: 'Enter' });
fireEvent.keyDown(element, { code: 'Space', ctrlKey: true });
```

### Verify LocalStorage
```javascript
const saved = JSON.parse(localStorage.getItem('morse-settings-v3'));
expect(saved.wpm).toBe(25);
```

## Troubleshooting

### Tests Timing Out
- Ensure `vi.useRealTimers()` is called in `afterEach`
- Check for infinite loops or unresolved promises

### DOM Not Found
- Verify element exists: `expect(element).toBeTruthy()`
- Check selectors match current DOM structure
- Ensure element is rendered before querying

### localStorage Issues
- Ensure `localStorage.clear()` is called in setup
- Verify keys match what the code uses

### Audio Tests Failing
- Check that AudioContext mock is properly configured
- Verify playback timeout logic is tested with fake timers

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user experiences
2. **Use descriptive test names** - `should increase level when accuracy >= 90%`
3. **Arrange-Act-Assert pattern** - Structure tests clearly
4. **One assertion per concept** - Keep tests focused
5. **Clean up after tests** - Use `afterEach` hooks
6. **Mock external dependencies** - Don't rely on real APIs
7. **Test edge cases** - Empty inputs, boundary conditions, etc.

## Future Enhancements

- [ ] Add visual regression tests
- [ ] Add accessibility tests (ARIA, keyboard navigation)
- [ ] Add performance benchmarks
- [ ] Add E2E tests with Playwright
- [ ] Add mutation testing
- [ ] Add snapshot tests for DOM structure

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
