# TypeScript Support

This library includes TypeScript definition files (`.d.ts`) for full TypeScript support while maintaining the vanilla JavaScript source code.

## Usage

### Installation

The TypeScript definitions are included in the package. No additional installation needed.

```bash
npm install n-carousel
```

### Basic Usage

```typescript
import { nCarouselInit } from 'n-carousel';
// or
import 'n-carousel';

// Initialize all carousels
nCarouselInit();

// Or with a specific container
const container = document.querySelector('.my-container');
nCarouselInit(container);
```

### Type Checking

TypeScript will provide type checking and autocomplete:

```typescript
// ✅ Type-safe
const carousel = document.querySelector('.n-carousel') as CarouselElement;
nCarouselInit(carousel);

// ❌ Type error - wrong type
nCarouselInit('invalid'); // Error: Argument of type 'string' is not assignable
```

### Carousel Element Types

```typescript
import type { CarouselElement, CarouselContentElement } from 'n-carousel';

// Type-safe carousel element
const carousel: CarouselElement = document.querySelector('.n-carousel') as CarouselElement;

// Access carousel-specific properties
const content = carousel.querySelector('.n-carousel__content');
if (content) {
  // TypeScript knows about nCarouselUpdate
  content.nCarouselUpdate?.(content);
  
  // TypeScript knows about dataset properties
  const duration = carousel.dataset.duration; // string | undefined
}
```

## How It Works

1. **Type Definitions Only**: The `.d.ts` file provides type information without changing the source code
2. **No Compilation Required**: The vanilla JS source remains unchanged
3. **Zero Runtime Overhead**: TypeScript types are stripped at compile time
4. **IDE Support**: Full autocomplete, type checking, and IntelliSense in VS Code and other editors

## Benefits

- ✅ **Type Safety**: Catch errors at compile time
- ✅ **Better DX**: Autocomplete and IntelliSense
- ✅ **No Breaking Changes**: Existing JS code continues to work
- ✅ **No Build Step**: Source remains vanilla JS
- ✅ **Smaller Bundle**: No TypeScript runtime overhead

## Example: React + TypeScript

```tsx
import React, { useEffect, useRef } from 'react';
import { nCarouselInit } from 'n-carousel';
import type { CarouselElement } from 'n-carousel';

const MyCarousel: React.FC = () => {
  const carouselRef = useRef<CarouselElement>(null);

  useEffect(() => {
    if (carouselRef.current) {
      nCarouselInit(carouselRef.current);
    }
  }, []);

  return (
    <div ref={carouselRef} className="n-carousel">
      <ul className="n-carousel__content">
        <li>Slide 1</li>
        <li>Slide 2</li>
        <li>Slide 3</li>
      </ul>
    </div>
  );
};
```

## Example: Vue + TypeScript

```vue
<template>
  <div ref="carousel" class="n-carousel">
    <ul class="n-carousel__content">
      <li>Slide 1</li>
      <li>Slide 2</li>
      <li>Slide 3</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { nCarouselInit } from 'n-carousel';
import type { CarouselElement } from 'n-carousel';

const carousel = ref<CarouselElement | null>(null);

onMounted(() => {
  if (carousel.value) {
    nCarouselInit(carousel.value);
  }
});
</script>
```

## Contributing Types

If you find missing types or want to improve the type definitions, please:

1. Update `n-carousel.d.ts`
2. Test with TypeScript's `tsc --noEmit`
3. Submit a PR

The type definitions should accurately reflect the JavaScript API without adding runtime overhead.

