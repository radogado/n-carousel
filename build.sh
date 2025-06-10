#!/bin/bash

# Compile SASS
./node_modules/sass/sass.js n-carousel.scss n-carousel.css
./node_modules/sass/sass.js demo/demo.scss demo/demo.css

# Minify CSS
./node_modules/clean-css-cli/bin/cleancss -o n-carousel.min.css n-carousel.css

# Bundle and minify JavaScript using Rollup config
./node_modules/rollup/dist/bin/rollup -c rollup.config.js
./node_modules/terser/bin/terser -o n-carousel.min.js --source-map "url='n-carousel.min.js.map'" --compress --mangle -- n-carousel.rollup.js

# Minify preload script
./node_modules/terser/bin/terser -o n-carousel-preload.min.js --source-map "url='n-carousel-preload.min.js.map'" --compress --mangle -- n-carousel-preload.js

# Calculate gzip sizes
./node_modules/gzip-size-cli/cli.js --raw n-carousel.min.css > n-carousel.min.css.size
./node_modules/gzip-size-cli/cli.js --raw n-carousel.min.js > n-carousel.min.js.size
./node_modules/gzip-size-cli/cli.js --raw n-carousel-preload.min.js > n-carousel-preload.min.js.size

# Clean up temporary files
rm n-carousel.rollup.js
