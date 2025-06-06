# Native Carousel

A lightweight, dependency-free carousel component that uses native browser features. No jQuery or other dependencies required.

## Features

- 🚀 Zero dependencies
- 📱 Responsive design
- ♿ Accessibility support
- 🎨 Customizable styling
- ⚡ Performance optimized
- 🔍 SEO friendly
- 🛠️ Simple API
- ⚛️ React support

## Installation

### NPM
```bash
npm install n-carousel
```

### CDN
```html
<link rel="stylesheet" href="https://unpkg.com/n-carousel@1.2.20/n-carousel.min.css">
<script src="https://unpkg.com/n-carousel@1.2.20/n-carousel.min.js" type="module" async></script>
```

## Quick Start

### Vanilla JavaScript
1. Include the CSS and JavaScript files
2. Add the carousel markup
3. Initialize the carousel

```html
<!-- Include the files -->
<link rel="stylesheet" href="n-carousel.min.css">
<script src="n-carousel.min.js" type="module" async></script>

<!-- Add the carousel markup -->
<div class="n-carousel">
    <div class="n-carousel__content">
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
    </div>
    
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

### React
```jsx
import React from 'react';
import NCarousel from 'n-carousel/react/NCarousel';

const MyCarousel = () => {
  return (
    <NCarousel options={{
      endless: true,
      vertical: true,
      autoHeight: true,
      controlsOutside: true,
      tabs: true,
      indexAlignStart: true
    }}>
      <div>Slide 1</div>
      <div>Slide 2</div>
      <div>Slide 3</div>
    </NCarousel>
  );
};
```

#### React Props
- `children`: React nodes to be rendered as slides
- `className`: Additional CSS classes
- `showNavigation`: Show/hide previous/next buttons (default: true)
- `showIndex`: Show/hide index dots (default: true)
- `options`: Object of boolean flags for carousel features (see below)

#### All Available Options
| Option            | Effect (adds class)                | Description |
|-------------------|------------------------------------|-------------|
| `endless`         | `n-carousel--endless`              | Infinite looping |
| `vertical`        | `n-carousel--vertical`             | Vertical orientation |
| `autoHeight`      | `n-carousel--auto-height`          | Auto height for slides |
| `overlay`         | `n-carousel--overlay`              | Overlay modal style |
| `inline`          | `n-carousel--inline`               | Inline mode |
| `indexEnd`        | `n-carousel--index-end`            | Index at end |
| `indexAlignEnd`   | `n-carousel--index-align-end`      | Index alignment end |
| `peek`            | `n-carousel--peek`                 | Peeking effect |
| `rtl`             | `n-carousel--rtl`                  | Right-to-left direction |
| `indexAlignCenter`| `n-carousel--index-align-center`   | Index alignment center |
| `indexAlignStart` | `n-carousel--index-align-start`    | Index alignment start |
| `indexStart`      | `n-carousel--index-start`          | Index at start |
| `controlsOutside` | `n-carousel--controls-outside`     | Controls outside content |
| `thumbnails`      | `n-carousel--thumbnails`           | Thumbnails for index |
| `tabs`            | `n-carousel--tabs`                 | Tabs style for index |
| `lightbox`        | `n-carousel--lightbox`             | Lightbox mode |
| `autoSlide`       | `n-carousel--auto-slide`           | Auto slide mode |
| `tabsAlignEnd`    | `n-carousel--tabs-align-end`       | Tabs alignment end |
| `instant`         | `n-carousel--instant`              | Instant transitions |

## Customization

### CSS Variables

You can customize the carousel appearance using CSS variables:

```css
.n-carousel {
    --n-carousel-width: 100%;
    --n-carousel-height: 400px;
    --n-carousel-background: #fff;
    --n-carousel-button-color: #000;
    --n-carousel-button-background: rgba(255, 255, 255, 0.8);
}
```

### Styling Classes

- `.n-carousel` - Main container
- `.n-carousel__content` - Slides container
- `.n-carousel__previous` - Previous button container
- `.n-carousel__next` - Next button container
- `.n-carousel__index` - Navigation dots container

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT © [Radoslav Sharapanov](https://github.com/radogado)

## Demo

Check out the [live demo](https://nativecarousel.com/) to see the carousel in action.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.