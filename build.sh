./node_modules/sass/sass.js n-carousel.scss n-carousel.css
./node_modules/sass/sass.js demo/demo.scss demo/demo.css
./node_modules/clean-css-cli/bin/cleancss -o n-carousel.min.css n-carousel.css
./node_modules/rollup/dist/bin/rollup n-carousel.js > n-carousel.rollup.js
./node_modules/terser/bin/terser -o n-carousel.min.js --source-map "url='n-carousel.min.js.map'" --compress --mangle -- n-carousel.rollup.js
#rm n-carousel.rollup.js
./node_modules/terser/bin/terser -o n-carousel-preload.min.js --source-map "url='n-carousel-preload.min.js.map'" --compress --mangle -- n-carousel-preload.js
./node_modules/gzip-size-cli/cli.js --raw n-carousel.min.css > n-carousel.min.css.size
./node_modules/gzip-size-cli/cli.js --raw n-carousel.min.js > n-carousel.min.js.size
./node_modules/gzip-size-cli/cli.js --raw n-carousel-preload.min.js > n-carousel-preload.min.js.size
