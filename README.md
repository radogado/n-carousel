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

## Installation

### NPM
```bash
npm install n-carousel
```

### CDN
```html
<link rel="stylesheet" href="https://unpkg.com/n-carousel@1.2.18/n-carousel.min.css">
<script src="https://unpkg.com/n-carousel@1.2.18/n-carousel.min.js" type="module" async></script>
```

## Quick Start

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
- Edge (latest)

## License

MIT © [Radoslav Sharapanov](https://github.com/radogado)

## Demo

Check out the [live demo](https://nativecarousel.com/) to see the carousel in action.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
```

[Demo](https://nativecarousel.com/)
