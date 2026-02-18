# MorseMaster Trainer

A modern, adaptive Morse Code training application built with vanilla JavaScript. It uses the Koch Method and Farnsworth timing to help users build instant character recognition and rhythm skills.

This project is designed to be **modular**, **zero-dependency**, and **embeddable**.

## Features

* **Adaptive Learning:** Automatically increases difficulty as your accuracy improves.
* **Koch Method:** Introduces characters in a specific order (K, M, R, S, U...) to maximize rhythmic contrast.
* **Farnsworth Timing:** Keeps character speed high (e.g., 20 WPM) while slowing down spacing, preventing you from counting dots and dashes.
* **Practice Generators:**
    * **Intercept Broadcast:** Generates random practice sentences using the currently unlocked characters.
    * **Smart Coach:** Analyzes your accuracy history and creates drills focusing on weaker characters.
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

* `index.html`: A simple wrapper demonstrating how to initialize the app.
* `morse-trainer.js`: The core logic class. Zero external dependencies.
* `morse-trainer.css`: All styling, scoped with CSS variables for easy theming.
* `start_server.sh`: A simple Python-based HTTP server for local testing.
* `THEMING.md`: Complete theming documentation with examples and all CSS variables.
* `THEMES_EXAMPLES.html`: Live gallery showcasing 7 different theme variations.

## Deployment & Embedding

### 1. Standalone (Static Host)
Upload `index.html`, `morse-trainer.js`, and `morse-trainer.css` to any static hosting service (AWS S3, GitHub Pages, Netlify). It works immediately with no build process.

### 2. Embedding in an Existing Website
To add the trainer to your personal blog or website:

**Step 1: Upload Assets**
Upload `morse-trainer.js` and `morse-trainer.css` to your site's assets folder.

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

This project includes comprehensive automated tests with **97.99% code coverage**.

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

### Test Coverage

The test suite includes **166 tests** covering:

- **Core Functionality** - Morse code generation, audio playback, challenge generation, answer validation, statistics tracking
- **UI Behavior** - DOM rendering, event handlers, tab navigation, modal interactions, keyboard shortcuts
- **Integration** - Complete user workflows, settings persistence, level progression, error handling

**Coverage Metrics**: 97.99% statements | 91.59% branches | 100% functions

See [tests/README.md](tests/README.md) for detailed testing documentation.

## Browser Compatibility

* Modern browsers (Chrome, Firefox, Safari, Edge)
* Requires Web Audio API support
* Works on mobile devices
* Optional: Chrome's built-in AI API for enhanced AI features

## License

MIT