# MorseMaster Trainer

A modern, adaptive Morse Code training application built with vanilla JavaScript. It uses the Koch Method and Farnsworth timing to help users build instant character recognition and rhythm skills.

This project is designed to be **modular**, **zero-dependency**, and **embeddable**.

## Features

* **Adaptive Learning:** Automatically increases difficulty as your accuracy improves.
* **Koch Method:** Introduces characters in a specific order (K, M, R, S, U...) to maximize rhythmic contrast.
* **Farnsworth Timing:** Keeps character speed high (e.g., 20 WPM) while slowing down spacing, preventing you from counting dots and dashes.
* **Interactive Koch Grid:** 
    * **Tap** a character button to hear its Morse code
    * **Long-press** (500ms+) a character to add/remove it from your character set
* **Practice Generators:**
    * **Intercept Broadcast:** Generates batches of 10 creative sentences using your unlocked characters
    * **Smart Coach:** Analyzes your accuracy history and creates batches of 8 drills focusing on weaker characters
* **Responsive Design:** Works beautifully on desktop and mobile.

## Quick Start (Local)

Because this project uses ES Modules (`import/export`), it must be run via a local web server (opening the file directly in the browser will result in CORS errors).

1.  **Run the helper script:**
    ```bash
    chmod +x start_server.sh
    ./start_server.sh
    ```
2.  **Open your browser:**
    Navigate to `http://localhost:8000`

## File Structure

### Core Application
* **`morse-trainer.js`** - Main orchestrator class that coordinates all services and UI rendering
* **`index.html`** - Simple wrapper demonstrating how to initialize the app
* **`morse-trainer.css`** - All styling, scoped with CSS variables for easy theming

### Service Classes (Modular Architecture)
* **`audio-synthesizer.js`** - Encapsulates Web Audio API operations for Morse code sound synthesis
* **`state-manager.js`** - Manages persistent state (settings, statistics) with localStorage integration and validation
* **`content-generator.js`** - Generates training challenges and validates AI responses
* **`ai-operations.js`** - Handles browser AI APIs with fallbacks for challenge generation

### Utilities & Support
* **`dom-utils.js`** - DOM caching and element management
* **`error-handler.js`** - Error handling and AI operation wrapper
* **`utils.js`** - Helper functions (timing, statistics, debouncing)
* **`constants.js`** - Centralized configuration, magic values, and content dictionaries

### Documentation & Configuration
* **`THEMING.md`** - Complete theming documentation with CSS variables and examples
* **`THEMES_EXAMPLES.html`** - Live gallery of 7 different theme variations
* **`vitest.config.js`** - Test runner configuration
* **`start_server.sh`** - Python-based HTTP server for local development

## Deployment & Embedding

### Architecture

Morse Master uses a **modular architecture** with separated concerns:

- **MorseTrainer** (core orchestrator) - Coordinates UI rendering and delegates logic to service classes
- **AudioSynthesizer** - Handles all Web Audio API operations (synthesis, playback control, timing)
- **StateManager** - Manages persistent settings and statistics with localStorage
- **ContentGenerator** - Generates practice challenges and validates responses
- **AIOperations** - Abstracts browser AI APIs with graceful fallbacks

This design enables:
- ✅ Easy testing with isolated service classes
- ✅ Simple customization by modifying individual services
- ✅ Zero external dependencies (pure vanilla JavaScript)
- ✅ ~50% smaller main class (1000 lines vs 1300+ before refactoring)

### 1. Standalone (Static Host)
Upload `index.html`, `morse-trainer.js`, and `morse-trainer.css` to any static hosting service (AWS S3, GitHub Pages, Netlify). It works immediately with no build process.

### 2. Embedding in an Existing Website
To add the trainer to your personal blog or website:

**Step 1: Upload Assets**
Upload the `src/` directory to your site's assets folder.

**Step 2: Add HTML**
Add the CSS link and a container `div` where you want the app to appear:

```html
<head>
    <!-- ... other tags ... -->
    <link rel="stylesheet" href="/path/to/morse-trainer.css">
</head>
<body>
    <!-- The app will mount here -->
    <div id="morse-app-container"></div>

    <!-- Initialize -->
    <script type="module">
        import { MorseTrainer } from '/path/to/morse-trainer.js';
        
        const container = document.getElementById('morse-app-container');
        new MorseTrainer(container);
    </script>
</body>
```

#### Embedding in a Hugo website
This project is packaged as a Hugo module, to make this easy.

**Step 1: Get the module**
Run `hugo mod get github.com/mhweaver/morse-master` in your hugo site's directory (you may need to `hugo mod init <path to repo>` first).

**Step 2: Create a mount**
Integrate this into your `hugo.yaml`:

```yaml
module:
  imports:
    - path: github.com/mhweaver/morse-master
      mounts:
        - source: src
          target: static/morse
```

This makes it so that when rendering your site, the `src` directory from this project will be mounted to `static/morse` in your site.

From here, you can create a simple HTML file like the `index.html` example in this repo, and put it somewhere in `static/` to host the trainer. Note that the `js` and `css` files will be accessible in the `/morse` directory due to the above mount configuration.

**Step 3: Create a shortcode**
Create a new file, `morse-master.html` in `layouts/shortcodes` with the following contents:

```html
{{/* Usage: {{< morse-trainer >}} 
  
  Assumes the 'src' folder from the module is mounted to 'static/morse'
*/}}

<!-- Load the Main CSS -->
<link rel="stylesheet" href="/morse/morse-trainer.css">

<style>
    :root {
        /* Add theme overrides here. See THEMING.md and THEMES_EXAMPLES.html for details. */
    }
    
    /* Container for the app - app handles its own internal layout and styling */
    .morse-app-wrapper {
        width: 100%;
        margin: 2rem 0;
        line-height: 1.5;
        box-sizing: border-box;
    }
</style>

<!-- The App Container -->
<div id="morse-trainer-{{ .Ordinal }}" class="morse-app-wrapper"></div>

<!-- Initialize the Module -->
<script type="module">
    // Point this to your main entry file inside the mounted folder
    import { MorseTrainer } from '/morse/morse-trainer.js';
    
    const container = document.getElementById('morse-trainer-{{ .Ordinal }}');
    
    // Initialize
    if (container) {
        new MorseTrainer(container);
    }
</script>

<!-- Optional: Scoped Layout Fixes -->
<style>
    /* Ensure the app breaks out of narrow blog columns if necessary */
    .morse-app-wrapper {
        width: 100%;
        margin: 2rem 0;
        /* Resets basic properties to prevent theme bleeding */
        line-height: 1.5; 
        box-sizing: border-box;
    }
</style>
```

**Step 4: Use it!**
In a content file, add `{{ <morse-master> }}`, to embed the trainer in the post.

## Interactive Koch Grid

The Koch progress grid features interactive character learning:

### Tap to Preview
- **Short Tap** (< 500ms) on a character button plays its Morse code
- Useful for learning character pronunciation before adding it to your practice set
- Uses your current playback settings (WPM, frequency, volume)

### Long-Press to Toggle
- **Long-Press** (500ms+) on a character button adds or removes it from your character set
- Gives you manual control over which characters to practice
- Long-press visual feedback helps distinguish from short tap

## AI-Powered Batch Generation

### Optimized for Cost & Performance

Both AI features now generate batches of challenges to reduce API calls and costs:

- **Intercept Broadcast**: Generates 10 creative sentences per batch (vs. 1 before)
- **Smart Coach**: Generates 8 targeted drills per batch (vs. 1 before)

This means:
- **80-90% fewer API calls** to cloud services like Gemini
- **Sustained practice** without waiting for API responses between challenges
- **Intelligent fallback**: Offline template engine also generates full batches
- **Smart level handling**: If you auto-advance mid-batch, the old batch is discarded to show new-level content

### How It Works

1. When you click "Intercept Broadcast" or "Smart Coach", the app generates a batch of challenges
2. You practice the first challenge from the batch
3. After checking your answer, the next challenge from the batch is automatically queued
4. If you level up or down, the remaining batch is discarded (you'll get new-level challenges next)
5. When the batch is exhausted, a new batch is generated on demand

This architectural improvement significantly reduces AI API usage while improving the learning experience.

## Theming & Customization


Morse Master is **fully themable** using CSS custom properties (CSS variables). You can customize colors, fonts, spacing, shadows, and more without modifying the core CSS file.

### Quick Theme Example

```html
<style>
    :root {
        /* Change primary color to ocean blue */
        --mt-primary: #0891b2;
        --mt-primary-hover: #0e7490;
        
        /* Light blue background */
        --mt-bg: #ecfeff;
        
        /* Custom font */
        --mt-font: 'Inter', system-ui, sans-serif;
    }
</style>
```

### Available Themes

The theming system includes **60+ CSS variables** controlling:

- **Colors**: Primary, secondary, backgrounds, text, status colors (success/error/info)
- **Typography**: Font families (sans-serif and monospace)
- **Spacing**: Border radius, shadows, transitions
- **Accents**: Cyan, indigo, sky blue, warning colors

### Complete Documentation

See **[THEMING.md](THEMING.md)** for:
- Complete list of all CSS variables
- 6 pre-built example themes (Dark, Ocean, Sunset, Forest, Purple, Minimal)
- Dark mode auto-detection
- Advanced customization techniques
- Accessibility and contrast guidelines
- Multiple instance theming

### Example: Dark Mode

```html
<style>
    @media (prefers-color-scheme: dark) {
        :root {
            --mt-primary: #6366f1;
            --mt-bg: #0f172a;
            --mt-surface: #1e293b;
            --mt-text-main: #f1f5f9;
            --mt-text-muted: #94a3b8;
            --mt-border: #334155;
        }
    }
</style>
```

## Testing

This project includes comprehensive automated tests with **301 passing test cases**.

### Running Tests

```bash
# Install dependencies (first time only)
npm install

# Run tests in watch mode (interactive)
npm test

# Run tests once (for CI/CD)
npm run test:run

# Open interactive test UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

See [tests/README.md](tests/README.md) for detailed testing documentation.

## Browser Compatibility

* Modern browsers (Chrome, Firefox, Safari, Edge)
* Requires Web Audio API support
* Works on mobile devices
* Optional: Chrome's built-in AI API for enhanced AI features

## License

MIT