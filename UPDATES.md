# MorseMaster Updates

## v1.1

### New Features

#### 1. **Level-Up Jingle**
- When a user auto-advances to a new level (via automatic level-up), a celebratory 3-note jingle plays
- Uses a major triad (C, E, G) sine wave tones
- Currently only plays on automatic level-up, not on manual level changes
- Very subtle (150ms duration per note) so it doesn't interrupt user experience

#### 2. **Koch Character Audio Preview**
- Users can now tap/click a character button to hear its Morse code (short tap = 300-500ms)
- Useful for learning and verifying character pronunciation before adding to the character set
- Uses the same audio settings (WPM, frequency, volume) as the main playback

#### 3. **Optimized AI Batch Generation**
- Multiple challenges generated in a single pass to reduce latency and cost
- Offline fallbacks also generate full batches using template-based generation
- Better for user flow since they get sustained practice on a topic

#### 4. **Smart Level Advancement with Batches**
- If user auto-advances/regresses level while in middle of an AI-generated batch, the batch is discarded
- Next challenge will be from the new level's pool
- Prevents users from getting "stuck" in old level challenges after leveling up

### Configuration Changes

#### New Constants Added to `constants.js`:
```javascript
CONTENT_GENERATION.BATCH_SIZE = 10                // Broadcast batch size
CONTENT_GENERATION.BATCH_SMART_COACH_SIZE = 8    // Smart Coach batch size
```

### API Changes

#### New Methods in `MorseTrainer`:
- `playKochCharacter(char)` - Plays the Morse code for a single character
- `loadNextQueuedChallenge(feedbackElement, hasWeakChars)` - Loads next challenge from internal queue

#### New Methods in `AudioSynthesizer`:
- `playJingle(onComplete)` - Plays celebratory jingle (returns Promise<void>)

#### Updated Methods in `AIOperations`:
- `generateBroadcastBatch(batchSize, onSuccess, onFallback, onError)` - Generates batch of broadcasts
- `generateCoachBatch(batchSize, onSuccess, onFallback, onError)` - Generates batch of coach drills

#### New Methods in `ContentGenerator`:
- `generateBroadcastBatch(batchSize, lessonLevel, manualChars)` - Generates multiple broadcast challenges
- `generateCoachBatch(batchSize, lessonLevel, manualChars)` - Generates multiple coach challenges

### State Changes

#### New Properties in `MorseTrainer`:
- `challengeQueue` - Array of queued challenges from batch generation
- `kochLongPressTimers` - Object tracking long-press timers for Koch buttons
- `isCurrentBatchFromNewLevel` -  Boolean flag for level change optimization

### Testing

- All existing tests pass (170 tests)
- Updated Koch button interaction tests to test tap vs long-press separately
- New tests verify batch generation and level-up behavior

### Migration Guide

If you have custom code relying on the old Koch button behavior:

**Old way (no longer works):**
```javascript
// Click events on Koch buttons used to toggle character
kochBtn.addEventListener('click', () => trainer.toggleChar(char));
```

**New way:**
```javascript
// For audio playback on tap
kochBtn.addEventListener('mousedown', () => startLongPressTimer(char, 500));
kochBtn.addEventListener('mouseup', () => {
  if (longPressDuration < 500) {
    trainer.playKochCharacter(char); // Short tap
  } else {
    trainer.toggleChar(char); // Long press
  }
});

// Or just use the new methods directly
trainer.playKochCharacter(char);    // Play character audio
trainer.toggleChar(char);             // Toggle character status
```

### Performance Impact

- **Reduced API Calls**: Cloud AI users will see ~80-90% reduction in API calls (10 challenges per call instead of 1)
- **Improved UX**: Users experience more sustained practice without waiting for API responses
- **Offline**: Batch template generation is similarly optimized
- **Backward Compatible**: All API fallbacks and offline modes work seamlessly with batch generation

### Known Limitations

- Jingle only plays on automatic level-up, not on manual level changes (intentional)
- Long-press timeout is fixed at 500ms
- Batch sizes are not user-configurable via UI (can be changed via constants)

### Future Enhancements

- Make batch sizes user-configurable
- Add jingle to manual level changes (with toggle)
- Add visual feedback for "batch remaining" in UI
- Implement batch caching for offline mode
