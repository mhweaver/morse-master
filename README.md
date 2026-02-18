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