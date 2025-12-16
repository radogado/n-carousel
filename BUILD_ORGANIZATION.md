# Build Organization

## Directory Structure

### Source Files (`src/`)
- All source code modules
- SCSS source files (`src/styles/`)
- `scrollyfills.module.js` (moved from root)

### Build Output (`dist/`)
All build artifacts are now output to the `dist/` directory:
- `n-carousel.css` - Compiled CSS
- `n-carousel.min.css` - Minified CSS
- `n-carousel.min.css.size` - Gzip size
- `n-carousel.rollup.js` - Rollup bundle (intermediate)
- `n-carousel.rollup.js.map` - Source map for rollup bundle
- `n-carousel.min.js` - Final minified JavaScript
- `n-carousel.min.js.map` - Source map for minified JS
- `n-carousel.min.js.size` - Gzip size

### Root Directory
- `n-carousel.js` - Old monolithic file (kept for backward compatibility)
- `n-carousel.scss` - Old monolithic SCSS (kept for reference)
- `n-carousel-preload.js` - Preload script (stays in root for easy access)
- `index.html` - Demo page (updated to use `dist/` files)

## Build Process

1. **SCSS Compilation**: `src/styles/main.scss` → `dist/n-carousel.css`
2. **CSS Minification**: `dist/n-carousel.css` → `dist/n-carousel.min.css`
3. **JS Bundling**: `src/index.js` → `dist/n-carousel.rollup.js` (via Rollup)
4. **JS Minification**: `dist/n-carousel.rollup.js` → `dist/n-carousel.min.js` (via Terser)
5. **Size Calculation**: Gzip sizes saved to `.size` files

## Configuration Updates

- **package.json**: `main` field points to `dist/n-carousel.min.js`
- **package.json**: `files` array updated to include `dist/` files
- **rollup.config.js**: Outputs to `dist/n-carousel.rollup.js`
- **.gitignore**: Added `dist/`, `*.map`, `*.size` to ignore build artifacts
- **index.html**: Updated to reference `dist/` files

## Usage

### For Development
```bash
npm run build
```

### For Production
Files in `dist/` are ready for deployment:
```html
<link rel="stylesheet" href="dist/n-carousel.min.css">
<script src="dist/n-carousel.min.js" type="module"></script>
```

## Notes

- Old `n-carousel.js` and `n-carousel.scss` remain in root for backward compatibility
- Build artifacts are automatically generated and should not be committed
- The `dist/` directory is gitignored


