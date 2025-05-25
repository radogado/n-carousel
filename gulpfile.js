const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const gzipSize = require('gzip-size');
const fs = require('fs');
const path = require('path');

// Helper function to report gzip size
function reportGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const size = gzipSize.sync(content);
  console.log(`${path.basename(filePath)}: ${(size / 1024).toFixed(2)} KB (gzipped)`);
}

// SCSS to CSS
function styles() {
  return gulp.src('n-carousel.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('.')) // n-carousel.css
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'))
    .on('end', () => {
      reportGzipSize('n-carousel.min.css');
    });
}

// JS minification
function scripts() {
  return gulp.src('n-carousel.js')
    .pipe(sourcemaps.init())
    .pipe(terser())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'))
    .on('end', () => {
      reportGzipSize('n-carousel.min.js');
    });
}

// Watch task (optional)
function watchFiles() {
  gulp.watch('n-carousel.scss', styles);
  gulp.watch('n-carousel.js', scripts);
}

exports.styles = styles;
exports.scripts = scripts;
exports.watch = watchFiles;
exports.default = gulp.series(styles, scripts); 