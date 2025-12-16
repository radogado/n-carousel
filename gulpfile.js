// Suppress Node.js deprecation warnings from dependencies
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  // Only suppress DEP0180 (fs.Stats constructor) from dependencies
  if (warning.name === 'DeprecationWarning' && warning.code === 'DEP0180') {
    return; // Suppress this specific warning
  }
  // Show other warnings
  console.warn(warning.name, warning.message);
});

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const gzipSize = require('gzip-size');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Helper function to report gzip size
function reportGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const size = gzipSize.sync(content);
  console.log(`${path.basename(filePath)}: ${(size / 1024).toFixed(2)} KB (gzipped)`);
}

// SCSS to CSS
let isBuildingStyles = false;
function styles() {
  // Prevent infinite loops
  if (isBuildingStyles) {
    return Promise.resolve();
  }
  isBuildingStyles = true;
  
  return new Promise((resolve, reject) => {
    gulp.src('n-carousel.scss')
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', (err) => {
        isBuildingStyles = false;
        reject(err);
      }))
      .pipe(gulp.dest('.')) // n-carousel.css
      .pipe(cleanCSS())
      .pipe(rename({ suffix: '.min' }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('.'))
      .on('end', () => {
        isBuildingStyles = false;
        reportGzipSize('n-carousel.min.css');
        resolve();
      })
      .on('error', (err) => {
        isBuildingStyles = false;
        reject(err);
      });
  });
}

// JS bundling and minification
let isBuilding = false;
function scripts() {
  // Prevent infinite loops
  if (isBuilding) {
    return Promise.resolve();
  }
  isBuilding = true;
  
  return new Promise((resolve, reject) => {
    // First bundle with rollup
    execAsync('./node_modules/rollup/dist/bin/rollup n-carousel.js --format es --file n-carousel.rollup.js')
      .then(() => {
        // Then minify the bundled file
        return new Promise((resolveMinify, rejectMinify) => {
          gulp.src('n-carousel.rollup.js')
            .pipe(sourcemaps.init())
            .pipe(terser())
            .pipe(rename('n-carousel.min.js'))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('.'))
            .on('end', async () => {
              // Clean up rollup file
              try {
                await execAsync('rm n-carousel.rollup.js');
              } catch (error) {
                // Ignore cleanup errors
              }
              reportGzipSize('n-carousel.min.js');
              isBuilding = false;
              resolveMinify();
            })
            .on('error', (error) => {
              isBuilding = false;
              rejectMinify(error);
            });
        });
      })
      .then(resolve)
      .catch((error) => {
        isBuilding = false;
        reject(error);
      });
  });
}

// Preload script minification
let isBuildingPreload = false;
function preloadScripts() {
  // Prevent infinite loops
  if (isBuildingPreload) {
    return Promise.resolve();
  }
  isBuildingPreload = true;
  
  return new Promise((resolve, reject) => {
    gulp.src('n-carousel-preload.js')
      .pipe(sourcemaps.init())
      .pipe(terser())
      .pipe(rename({ suffix: '.min' }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('.'))
      .on('end', () => {
        isBuildingPreload = false;
        reportGzipSize('n-carousel-preload.min.js');
        resolve();
      })
      .on('error', (err) => {
        isBuildingPreload = false;
        reject(err);
      });
  });
}

// Demo SCSS compilation
let isBuildingDemo = false;
function demoStyles() {
  // Prevent infinite loops
  if (isBuildingDemo) {
    return Promise.resolve();
  }
  isBuildingDemo = true;
  
  return new Promise((resolve, reject) => {
    gulp.src('demo/demo.scss')
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', (err) => {
        isBuildingDemo = false;
        reject(err);
      }))
      .pipe(gulp.dest('demo'))
      .on('end', () => {
        isBuildingDemo = false;
        console.log('Demo styles compiled');
        resolve();
      })
      .on('error', (err) => {
        isBuildingDemo = false;
        reject(err);
      });
  });
}

// Watch task
function watchFiles() {
  console.log('🔍 Watching for changes...');
  console.log('📁 Watching: n-carousel.scss, n-carousel.js, n-carousel-preload.js, demo/demo.scss');
  console.log('');
  
  // Watch only source files - pass functions directly to avoid anonymous tasks
  gulp.watch('n-carousel.scss', { ignoreInitial: true }, function watchStyles() {
    console.log('📝 n-carousel.scss changed');
    return styles();
  });
  
  gulp.watch('n-carousel.js', { ignoreInitial: true }, function watchScripts() {
    console.log('📝 n-carousel.js changed');
    return scripts();
  });
  
  gulp.watch('n-carousel-preload.js', { ignoreInitial: true }, function watchPreload() {
    console.log('📝 n-carousel-preload.js changed');
    return preloadScripts();
  });
  
  gulp.watch('demo/demo.scss', { ignoreInitial: true }, function watchDemoStyles() {
    console.log('📝 demo/demo.scss changed');
    return demoStyles();
  });
  
  // Watch for changes in demo directory SCSS files only (exclude CSS files)
  gulp.watch('demo/**/*.scss', { ignoreInitial: true, ignored: '**/*.css' }, function watchDemoSCSS() {
    console.log('📝 demo SCSS file changed');
    return demoStyles();
  });
}

exports.styles = styles;
exports.scripts = scripts;
exports.preload = preloadScripts;
exports.demo = demoStyles;
exports.watch = watchFiles;
exports.default = gulp.series(styles, scripts, preloadScripts); 