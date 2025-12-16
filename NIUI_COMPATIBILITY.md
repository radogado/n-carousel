# niui Component System Compatibility

## Overview

n-carousel is fully compatible with the niui component ingesting system. The bundled assets are structured to work seamlessly with niui's component registration and bundling process.

## File Structure for niui

### Entry Point
- **`n-carousel.js`** - Main entry point that imports the bundled module
  - Located in package root for npm/niui imports
  - Imports from `dist/n-carousel.rollup.js`

### Bundled Assets
- **`dist/n-carousel.rollup.js`** - ES module bundle (development)
- **`dist/n-carousel.min.js`** - Minified bundle (production)
- **`dist/n-carousel.css`** - Compiled CSS
- **`dist/n-carousel.min.css`** - Minified CSS
- **`n-carousel.scss`** - SCSS source (for niui's SCSS compilation)

## niui Integration

### Automatic Registration
The bundled module automatically registers with niui's component system:

```javascript
if (typeof nui !== 'undefined' && typeof nui.registerComponent === 'function') {
  nui.registerComponent('n-carousel', init);
}
```

### Usage in niui
niui can import n-carousel in two ways:

1. **Via npm package** (recommended):
   ```javascript
   import '../../node_modules/n-carousel/n-carousel.js';
   ```

2. **Direct import**:
   ```javascript
   import './dist/n-carousel.rollup.js';
   ```

### SCSS Import
niui can import the SCSS source:
```scss
@import '../../node_modules/n-carousel/n-carousel.scss';
```

## Package.json Configuration

- **`type: "module"`** - Ensures ES module syntax is recognized
- **`main: "n-carousel.js"`** - Points to the entry file
- **`files`** array includes all necessary assets for npm publishing

## Build Output

All build artifacts are in `dist/`:
- Keeps root directory clean
- Follows standard npm package structure
- Compatible with niui's build process

## Verification

The component will:
1. ✅ Auto-register with niui if `nui.registerComponent` is available
2. ✅ Work standalone if niui is not present
3. ✅ Export `init` function as default export
4. ✅ Expose `window.nCarouselInit` for manual initialization
5. ✅ Include all necessary CSS and JS assets

## niui Component File

For niui's component directory, create:
- `components/n-carousel@npm/n-carousel@npm.js`:
  ```javascript
  import "../../node_modules/n-carousel/n-carousel.js";
  ```
- `components/n-carousel@npm/n-carousel@npm.scss`:
  ```scss
  @import "../../node_modules/n-carousel/n-carousel.scss";
  ```


