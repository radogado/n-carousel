# Native Carousel

A carousel component which uses the native scroll snapping functionality with enhancements and customisation. It is lightweight, accessible, and has no dependencies.

**[Live Demo](https://nativecarousel.com/)**

## Features

- 🎯 **Native scroll snapping** - Uses browser's built-in scroll snap API
- ♿ **Accessible** - Full keyboard navigation, ARIA support, focus management
- 📱 **Responsive** - Works on all screen sizes
- 🌍 **RTL support** - Right-to-left language support
- ⚛️ **React-friendly** - Render HTML in React and call `window.nCarouselInit()` after updates
- 🎨 **Highly customizable** - 245,760+ valid option combinations
- 🪶 **Lightweight** - ~4.1 KB CSS + ~8.7 KB JS (gzipped)
- 🚫 **No dependencies** - Pure vanilla JavaScript and CSS (polyfills bundled)
- 📘 **TypeScript support** - Full type definitions included
- 🎭 **Multiple modes** - Horizontal, vertical, tabs, lightbox, inline, endless
- 🖼️ **Auto height** - Automatically adjusts to content height
- 🎪 **Peeking** - Show partial slides at edges
- 🎬 **Auto slide** - Automatic slide progression
- 🔍 **Fullscreen** - Native fullscreen API support
- 🖱️ **Touch & mouse** - Works with touch, mouse, and keyboard
- 🔄 **Dynamic initialization** - Initialize carousels added after page load
- 🔗 **Hash navigation** - Direct links to specific slides via URL hash

## Installation

### NPM

```bash
npm install n-carousel
```

**TypeScript users:** Type definitions are included! No additional installation needed. See [TYPESCRIPT.md](TYPESCRIPT.md) for details.

### CDN

```html
<link rel="stylesheet" href="https://unpkg.com/n-carousel/n-carousel.min.css">
<script src="https://unpkg.com/n-carousel/n-carousel.min.js" type="module"></script>
```

### Download

Get the files from the [releases page](https://github.com/radogado/n-carousel/releases) or use the minified versions:
- `n-carousel.min.css` (~4.1 KB gzipped)
- `n-carousel.min.js` (~8.7 KB gzipped)

## Quick Start

### Basic Setup

```html
<link rel="stylesheet" href="n-carousel.min.css">
<script src="n-carousel.min.js" type="module"></script>

<div class="n-carousel">
  <ul class="n-carousel__content">
    <li>Slide 1</li>
    <li>Slide 2</li>
    <li>Slide 3</li>
  </ul>
  
  <div class="n-carousel__previous">
    <button><span>Previous</span></button>
  </div>
  
  <div class="n-carousel__next">
    <button><span>Next</span></button>
  </div>
  
  <div class="n-carousel__index">
    <button><span>1</span></button>
    <button><span>2</span></button>
    <button><span>3</span></button>
  </div>
</div>
```

### Optional Preload Script

To avoid flashing when an initial slide is defaulted by URI hash, add the preload script at the top of your page:

```html
<script src="n-carousel-preload.min.js"></script>
```

## Options

Add modifier classes to customize your carousel:

### Layout Options

- `n-carousel--vertical` - Vertical scrolling carousel
- `n-carousel--rtl` - Right-to-left layout
- `n-carousel--inline` - Inline carousel (becomes overlay when clicked)
- `n-carousel--overlay` - Modal/overlay carousel
- `n-carousel--controls-outside` - Position controls outside the carousel

### Content Options

- `n-carousel--auto-height` - Automatically adjust height to content
- `n-carousel--peek` - Show partial slides at edges
- `n-carousel--endless` - Infinite loop carousel
- `n-carousel--auto-slide` - Automatically advance slides
- `n-carousel--instant` - Instant transitions (no animation)

**Auto height notes:** Height updates are debounced briefly after slide changes to prevent jitter, then re-measured via `ResizeObserver` (including on resize). Scroll-settled navigation still animates height, matching button navigation.

### Display Modes

- `n-carousel--tabs` - Tab-style navigation
- `n-carousel--tabs-align-end` - Align tab text to end (requires `--tabs`)
- `n-carousel--thumbnails` - Thumbnail navigation
- `n-carousel--lightbox` - Lightbox/gallery mode
- `n-carousel--aspect` - Maintain aspect ratio (for lightbox)

### Index Position

- `n-carousel--index-start` - Position index at start
- `n-carousel--index-end` - Position index at end
- `n-carousel--index-align-start` - Align index items to start
- `n-carousel--index-align-center` - Align index items to center
- `n-carousel--index-align-end` - Align index items to end

### Example with Options

```html
<div class="n-carousel n-carousel--auto-height n-carousel--peek n-carousel--vertical">
  <!-- content -->
</div>
```

## Data Attributes

### Slide Duration

Control the animation duration (in seconds):

```html
<div class="n-carousel" data-duration="0.5">
```

### Auto Slide Interval

Set the interval for auto-sliding (in seconds):

```html
<div class="n-carousel n-carousel--auto-slide" data-interval="4">
```

### Hash Navigation

Link directly to specific slides using URL hashes. Add an `id` attribute to any slide:

```html
<div class="n-carousel">
  <ul class="n-carousel__content">
    <li id="slide-1">Slide 1</li>
    <li id="slide-2">Slide 2</li>
    <li id="slide-3">Slide 3</li>
  </ul>
</div>
```

Then link to slides using `#slide-1`, `#slide-2`, etc. The carousel will automatically navigate to the slide when the page loads or when the hash changes.

**Note:** To avoid flashing when loading a page with a hash, include the preload script (see [Optional Preload Script](#optional-preload-script)).

## JavaScript API

### Initialize Carousels

```javascript
// Initialize all carousels in the document
window.nCarouselInit()

// Or initialize carousels within a specific container
window.nCarouselInit(containerElement)
```

The carousel automatically initializes on page load, but you can manually initialize dynamically added carousels using this function.

## React

`n-carousel` is vanilla JS. In React, you render the HTML structure and then call `window.nCarouselInit()` after render (and after any slide list changes).

### Manual integration (recommended)

1) Install:

```bash
npm i n-carousel
```

2) Import the assets once (e.g. in `main.tsx` / `App.tsx`):

```js
import 'n-carousel/n-carousel.min.css';
import 'n-carousel/n-carousel.js'; // defines window.nCarouselInit()
```

3) Initialize after render:

```jsx
import { useEffect, useRef } from 'react';

export function Gallery({ slides }) {
  const hostRef = useRef(null);

  useEffect(() => {
    window.nCarouselInit?.(hostRef.current || document);
  }, [slides.length]);

  return (
    <div ref={hostRef} className="n-carousel n-carousel--peek">
      <ul className="n-carousel__content" style={{ '--peek': '40px' }}>
        {slides.map((s) => (
          <li key={s.id}>{s.title}</li>
        ))}
      </ul>
      <div className="n-carousel__previous"><button><span>Previous</span></button></div>
      <div className="n-carousel__next"><button><span>Next</span></button></div>
      <div className="n-carousel__index">
        {slides.map((s, i) => (<button key={s.id}><span>{i + 1}</span></button>))}
      </div>
    </div>
  );
}
```

### Optional thin wrapper (this repo)

This repo includes a tiny helper in `react/` (used by the demo) that just calls `window.nCarouselInit()` for you:
- `import { NCarousel } from 'n-carousel-react'`
- `import 'n-carousel-react/styles'`

## CSS Variables

Customize the appearance using CSS variables:

### Theme Colors

```css
.n-carousel {
  --nui-control-bg: darkorchid;
  --nui-control-active-bg: darkorchid;
  --nui-control-highlight: darkblue;
  --nui-control-color: #a5f9a5;
  --nui-control-active-color: #a5f9a5;
  --nui-carousel-bg: black;
  --nui-carousel-color: white;
  --nui-border-radius: 0; /* Border radius for controls */
}
```

### Layout Variables

```css
.n-carousel__content {
  --peek: 12ch; /* Peeking amount */
}

.n-carousel {
  --max-height: 75vh; /* Max height for vertical carousel */
}

.n-carousel--aspect {
  --ratio: 16 / 9; /* Aspect ratio for lightbox */
}

picture {
  --placeholder: url(image.jpg); /* Low-res placeholder for images */
}
```

### Subpixel Compensation

The `--subpixel-compensation` variable is automatically calculated to ensure precise scroll snapping alignment.

**The Problem:**
Browsers can't scroll to subpixel positions - they round to whole pixels. When element dimensions are fractional (e.g., `500.7px`), scroll snapping can misalign because the browser rounds the scroll position.

**The Solution:**
The carousel measures the difference between the ceiling value and the actual fractional dimension, then adds that amount as padding to compensate. For example, if width is `500.3px`, compensation is `0.7` (ceiling `501px` minus actual `500.3px`), and `0.7px` padding is added to ensure perfect alignment.

**Note:** This is handled automatically - no manual configuration needed.

## Advanced Examples

### Detached Controls

Controls can be placed outside the carousel using the `data-for` attribute:

```html
<span class="n-carousel__previous" data-for="carousel-detached">
  <button><span>Previous</span></button>
</span>

<span class="n-carousel__next" data-for="carousel-detached">
  <button><span>Next</span></button>
</span>

<div class="n-carousel__index" data-for="carousel-detached">
  <button><span>1</span></button>
  <button><span>2</span></button>
  <button><span>3</span></button>
</div>

<!-- ... -->

<div class="n-carousel" id="carousel-detached">
  <ul class="n-carousel__content">
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
  </ul>
</div>
```

### Tabs Mode

For tabs, add the class to the index controls:

```html
<div class="n-carousel n-carousel--tabs">
  <ul class="n-carousel__content">
    <li>Tab 1 Content</li>
    <li>Tab 2 Content</li>
    <li>Tab 3 Content</li>
  </ul>
  <div class="n-carousel__index">
    <button><span>Tab 1</span></button>
    <button><span>Tab 2</span></button>
    <button><span>Tab 3</span></button>
  </div>
</div>
```

### Lightbox

```html
<div class="n-carousel n-carousel--lightbox n-carousel--thumbnails">
  <ul class="n-carousel__content">
    <li>
      <figure>
        <picture style="--placeholder: url(thumb.jpg)">
          <img src="image.jpg" alt="Kaohsiung, Taiwan (photo)" loading="lazy" />
        </picture>
        <figcaption>Caption</figcaption>
      </figure>
    </li>
    <!-- more slides -->
  </ul>
  <div class="n-carousel__index">
    <button><img src="thumb1.jpg" alt="Slide 1 thumbnail" /></button>
    <button><img src="thumb2.jpg" alt="Slide 2 thumbnail" /></button>
  </div>
  <div class="n-carousel__controls">
    <div class="n-carousel__full-screen">
      <button><span>Toggle full screen</span></button>
    </div>
    <div class="n-carousel__close">
      <button><span>Close modal</span></button>
    </div>
  </div>
</div>
```

### Inline Lightbox

An inline lightbox becomes an overlay when clicking on a thumbnail:

```html
<div class="n-carousel n-carousel--lightbox n-carousel--inline n-carousel--thumbnails">
  <!-- same structure as lightbox -->
</div>
```

## Browser Support

Generally targeting the last 5 years of browser versions:

- **Chrome/Edge** - Last 5 years (Chrome 90+, Edge 90+)
- **Firefox** - Last 5 years (Firefox 88+)
- **Safari** - Last 5 years (Safari 14.1+, iOS Safari 14.5+)
- **Mobile browsers** - iOS Safari 14.5+, Chrome Mobile 90+

### Compatibility Notes

The codebase uses modern JavaScript features that require:

- **Optional chaining (`?.`)** - Requires Chrome 80+, Firefox 74+, Safari 13.1+ (2020+)
- **ResizeObserver API** - Requires Chrome 64+, Firefox 69+, Safari 13.1+ (2019-2020+)
- **ES Modules** - Widely supported since 2018
- **CSS Scroll Snap** - Requires Chrome 69+, Firefox 68+, Safari 11+ (2017-2019+)
- **CSS Logical Properties** - Requires Chrome 69+, Firefox 66+, Safari 12.2+ (2018-2019+)

The specified minimum versions (Chrome 90+, Firefox 88+, Safari 14.1+) fully support all required features. The code includes Safari-specific workarounds for known scroll snap and fullscreen API quirks.

Uses native scroll snapping with a polyfill for the `scrollend` event where needed.

**Note:** Safari includes native `scrollend` support in newer versions. The polyfill (`scrollyfills`) is bundled and uses feature detection (`"onscrollend" in window`) to activate only when needed.

## Development

### Build

```bash
npm install
npm run build
```

### Watch Mode

```bash
npm run watch
# or
npm run dev
```

### Serve

```bash
npm run serve
```

### Testing

The project includes a comprehensive test suite with both unit and visual regression tests:

**Unit Tests (Vitest):**
```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Visual Regression Tests (Playwright):**
```bash
# Run visual tests
npm run test:visual

# Run visual tests with UI
npm run test:visual:ui

# Update visual snapshots (when visual changes are intentional)
npm run test:visual:update
```

**Test Coverage:**

**Unit Tests (84 tests):**
- Basic carousel structure and DOM validation
- All option combinations (245,760+ valid combinations)
- Navigation controls and accessibility
- Keyboard events (Arrow keys, Home, End, Page Up/Down, Escape)
- Scrolling and scrollend events
- Button clicks and pointer events
- Focus management
- Data attributes and API functionality
- Integration tests for various use cases

**Playwright Tests (11 tests):**
- Basic carousel appearance
- Vertical, tabs, thumbnails, controls-outside, and peek options
- Interaction visual tests (button clicks, transitions)
- Regression tests for fullscreen restore, endless index mapping, and overlay fullscreen clickability
- Cross-browser visual consistency (Chrome, Firefox, Safari)
- Mobile viewport testing

See [tests/README.md](tests/README.md) for more details.

## File Structure

```
n-carousel/
├── n-carousel.scss              # Source SCSS
├── n-carousel.js                # Source JavaScript
├── n-carousel.min.css           # Minified CSS
├── n-carousel.min.js             # Minified JavaScript
├── n-carousel-preload.js        # Preload script source (optional)
├── n-carousel-preload.min.js    # Minified preload script (optional)
├── tests/                       # Test files
│   ├── visual/                  # Visual regression tests (Playwright)
│   └── *.test.js                # Unit tests (Vitest)
├── playwright.config.js         # Playwright configuration
├── vitest.config.js             # Vitest configuration
└── demo/                        # Demo files
```

## Accessibility

- Full keyboard navigation (Arrow keys, Home, End, Page Up/Down)
- ARIA attributes for screen readers
- Focus management and trapping
- Semantic HTML structure
- Skip links support

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Developed by [Radoslav Sharapanov](https://rado.bg) since 2020.

## Links

- [Live Demo](https://nativecarousel.com/)
- [GitHub Repository](https://github.com/radogado/n-carousel)
- [NPM Package](https://www.npmjs.com/package/n-carousel)
- [Announcement Post](https://rado.bg/introducing-native-carousel/)

## Changelog

### 1.2.27
- Current version

### 1.1
- Endless option
- Anchors support
- Tabbing support

### 1.0
- Initial release

---

**Note:** This carousel uses native browser features and is designed to be lightweight and performant. For the best experience, check out the [live demo](https://nativecarousel.com/) to see all features in action!
