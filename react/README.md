# n-carousel-react

React wrapper for `n-carousel` that keeps **a single source of truth** by reusing:
- `n-carousel/n-carousel.js`
- `n-carousel/n-carousel.scss` (or `n-carousel.min.css` if you prefer)

This wrapper provides:
- `useNCarousel(ref, deps?)`
- `<NCarousel />` helper component

It does **not** re-implement carousel logic.

## Usage

```tsx
import { NCarousel } from 'n-carousel-react';
import 'n-carousel-react/styles';

export function Gallery() {
  return (
    <NCarousel className="n-carousel n-carousel--peek">
      <ul className="n-carousel__content" style={{ ['--peek' as any]: '40px' }}>
        <li>Slide 1</li>
        <li>Slide 2</li>
      </ul>
      <div className="n-carousel__previous"><button><span>Previous</span></button></div>
      <div className="n-carousel__next"><button><span>Next</span></button></div>
      <div className="n-carousel__index">
        <button><span>1</span></button>
        <button><span>2</span></button>
      </div>
    </NCarousel>
  );
}
```

If you dynamically add/remove slides, pass a dependency key to re-init:

```tsx
<NCarousel deps={[slides.length]}>...</NCarousel>
```


