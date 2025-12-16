#!/bin/bash

# Build script for modular n-carousel
# Compiles SCSS and bundles JavaScript

echo "Building n-carousel..."

# Create dist directory
mkdir -p dist

# Compile SCSS from modular source
echo "Compiling SCSS..."
sass src/styles/main.scss dist/n-carousel.css --no-source-map

# Minify CSS
echo "Minifying CSS..."
./node_modules/clean-css-cli/bin/cleancss -o dist/n-carousel.min.css dist/n-carousel.css

# Bundle JavaScript with Rollup
echo "Bundling JavaScript..."
./node_modules/rollup/dist/bin/rollup -c rollup.config.js

# Minify JavaScript
echo "Minifying JavaScript..."
./node_modules/terser/bin/terser -o dist/n-carousel.min.js \
  --source-map "url='n-carousel.min.js.map'" \
  --compress \
  --mangle \
  -- dist/n-carousel.rollup.js

# Calculate gzip sizes
echo "Calculating bundle sizes..."
gzip-size --raw dist/n-carousel.min.css > dist/n-carousel.min.css.size
gzip-size --raw dist/n-carousel.min.js > dist/n-carousel.min.js.size

echo "Build complete!"
