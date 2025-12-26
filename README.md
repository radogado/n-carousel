# Native Carousel

A carousel component which uses the native scroll snapping functionality with enhancements and customisation. It is lightweight, accessible, and has no dependencies.

**[Live Demo](https://nativecarousel.com/)**

## Features

- 🎯 **Native scroll snapping** - Uses browser's built-in scroll snap API
- ♿ **Accessible** - Full keyboard navigation, ARIA support, focus management
- 📱 **Responsive** - Works on all screen sizes
- 🌍 **RTL support** - Right-to-left language support
- 🎨 **Highly customizable** - 245,760+ valid option combinations
- 🪶 **Lightweight** - ~4.2 KB CSS + ~6.0 KB JS (gzipped)
- 🚫 **No dependencies** - Pure vanilla JavaScript and CSS
- 🎭 **Multiple modes** - Horizontal, vertical, tabs, lightbox, inline, endless
- 🖼️ **Auto height** - Automatically adjusts to content height
- 🎪 **Peeking** - Show partial slides at edges
- 🎬 **Auto slide** - Automatic slide progression
- 🔍 **Fullscreen** - Native fullscreen API support
- 🖱️ **Touch & mouse** - Works with touch, mouse, and keyboard

## Installation

### NPM

```bash
npm install n-carousel
```

### CDN

```html
<link rel="stylesheet" href="https://unpkg.com/n-carousel/n-carousel.min.css">
<script src="https://unpkg.com/n-carousel/n-carousel.min.js" type="module"></script>
```

### Download

Get the files from the [releases page](https://github.com/radogado/n-carousel/releases) or use the minified versions:
- `n-carousel.min.css` (~25 KB, ~4.2 KB gzipped)
- `n-carousel.min.js` (~20 KB, ~6.0 KB gzipped)

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

## JavaScript API

### Initialize Carousels

```javascript
// Initialize all carousels in the document
window.nCarouselInit()

// Or initialize carousels within a specific container
window.nCarouselInit(containerElement)
```

The carousel automatically initializes on page load, but you can manually initialize dynamically added carousels using this function.

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
          <img src="image.jpg" alt="Image" loading="lazy" />
        </picture>
        <figcaption>Caption</figcaption>
      </figure>
    </li>
    <!-- more slides -->
  </ul>
  <div class="n-carousel__index">
    <button><img src="thumb1.jpg" alt="Thumbnail" /></button>
    <button><img src="thumb2.jpg" alt="Thumbnail" /></button>
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

**Note:** Safari added native support for the `scrollend` event in Safari 26.2+ (2025). The polyfill (`scrollyfills`) is still included and will automatically be used for older Safari versions (14.1-26.1) when native support is not available. The polyfill uses feature detection (`"onscrollend" in window`) to determine whether to activate.

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

**Visual Regression Tests (7 tests):**
- Basic carousel appearance
- Vertical, tabs, thumbnails, controls-outside, and peek options
- Interaction visual tests (button clicks, transitions)
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

### 1.2.18
- Current version

### 1.1
- Endless option
- Anchors support
- Tabbing support

### 1.0
- Initial release

---

**Note:** This carousel uses native browser features and is designed to be lightweight and performant. For the best experience, check out the [live demo](https://nativecarousel.com/) to see all features in action!
