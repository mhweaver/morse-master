#!/bin/bash

# Port to run on
PORT=8000

echo "-----------------------------------------------------"
echo "Starting Morse Trainer local server..."
echo "Open your browser to: http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo "-----------------------------------------------------"

# macOS comes with Python 3. This uses its built-in HTTP server.
# This is necessary because ES Modules (import/export) require 
# a valid HTTP context and cannot run directly from file://
if command -v python3 &>/dev/null; then
    python3 -m http.server $PORT
else
    echo "Error: Python 3 is not found in your PATH."
    echo "Please install Python or use 'npx http-server' if you have Node.js installed."
    exit 1
fi