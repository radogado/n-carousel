# React demo

This folder is a small React integration demo for `n-carousel`.

Notes:
- `n-carousel` itself is **vanilla JS** (no React wrapper).
- In React, render the HTML structure and call `window.nCarouselInit()` after render when slides/carousels are added dynamically.
- This demo imports the built assets from the **repo root** (`n-carousel.min.css` / `n-carousel.min.js`) via a Vite alias, so it does not install `n-carousel` from npm.

## Run

```bash
cd demo/react/app
npm install
npm run dev
```

## Build static demo (for Live Server)

```bash
cd demo/react/app
npm run build
```

This writes a static demo to:
- `demo/react/index.html`
- `demo/react/assets/react-demo.js`
- `demo/react/assets/react-demo.css`


