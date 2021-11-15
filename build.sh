./node_modules/sass/sass.js n-carousel.scss n-carousel.css
./node_modules/sass/sass.js demo/demo.scss demo/demo.css
./node_modules/clean-css-cli/bin/cleancss -o n-carousel.min.css n-carousel.css
./node_modules/terser/bin/terser -o n-carousel.min.js --compress --mangle -- n-carousel.js
./node_modules/gzip-size-cli/cli.js --raw n-carousel.min.css > n-carousel.min.css.size
./node_modules/gzip-size-cli/cli.js --raw n-carousel.min.js > n-carousel.min.js.size
