#!/bin/bash

# Watch script for n-carousel
# Rebuilds on changes to source files

echo "🔍 Watching for changes..."
echo "📁 Watching: n-carousel.scss, n-carousel.js, n-carousel-preload.js, demo/demo.scss"
echo ""

# Function to rebuild
rebuild() {
  echo ""
  echo "🔄 Changes detected, rebuilding..."
  echo "⏰ $(date '+%H:%M:%S')"
  ./build.sh
  echo "✅ Build complete!"
  echo ""
}

# Initial build
rebuild

# Watch for changes using fswatch (macOS) or inotifywait (Linux) or chokidar-cli
if command -v fswatch &> /dev/null; then
  # macOS - fswatch
  echo "✅ Using fswatch (macOS)"
  fswatch -o n-carousel.scss n-carousel.js n-carousel-preload.js demo/demo.scss | while read f; do
    rebuild
  done
elif command -v inotifywait &> /dev/null; then
  # Linux - inotifywait
  echo "✅ Using inotifywait (Linux)"
  while inotifywait -e modify,create,delete n-carousel.scss n-carousel.js n-carousel-preload.js demo/demo.scss 2>/dev/null; do
    rebuild
  done
elif command -v npx &> /dev/null; then
  # Fallback: use chokidar-cli via npx
  echo "✅ Using chokidar-cli (via npx)"
  npx --yes chokidar-cli "n-carousel.scss" "n-carousel.js" "n-carousel-preload.js" "demo/demo.scss" -c "./build.sh" --initial
else
  echo "⚠️  No file watcher found. Install one of:"
  echo "   - fswatch (macOS): brew install fswatch"
  echo "   - inotify-tools (Linux): sudo apt-get install inotify-tools"
  echo "   - Or ensure npx is available (comes with npm)"
  echo ""
  echo "Falling back to manual watch (press Ctrl+C to stop)..."
  while true; do
    sleep 2
  done
fi
