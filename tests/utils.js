/**
 * Test utilities for creating carousel DOM structures
 */

/**
 * Creates a basic carousel HTML structure
 */
export function createCarousel(options = {}) {
  const {
    slides = 3,
    classes = '',
    hasPrevious = true,
    hasNext = true,
    hasIndex = true,
    hasControls = false,
  } = options;

  const carousel = document.createElement('div');
  carousel.className = `n-carousel ${classes}`.trim();

  // Create content with slides
  const content = document.createElement('ul');
  content.className = 'n-carousel__content';
  for (let i = 0; i < slides; i++) {
    const slide = document.createElement('li');
    slide.textContent = `Slide ${i + 1}`;
    content.appendChild(slide);
  }
  carousel.appendChild(content);

  // Previous button
  if (hasPrevious) {
    const previous = document.createElement('div');
    previous.className = 'n-carousel__previous';
    previous.innerHTML = '<button><span>Previous</span></button>';
    carousel.appendChild(previous);
  }

  // Next button
  if (hasNext) {
    const next = document.createElement('div');
    next.className = 'n-carousel__next';
    next.innerHTML = '<button><span>Next</span></button>';
    carousel.appendChild(next);
  }

  // Index buttons
  if (hasIndex) {
    const index = document.createElement('div');
    index.className = 'n-carousel__index';
    for (let i = 0; i < slides; i++) {
      const button = document.createElement('button');
      button.innerHTML = `<span>${i + 1}</span>`;
      index.appendChild(button);
    }
    carousel.appendChild(index);
  }

  // Controls (fullscreen, close)
  if (hasControls) {
    const controls = document.createElement('div');
    controls.className = 'n-carousel__controls';
    controls.innerHTML = `
      <div class="n-carousel__full-screen">
        <button><span>Toggle full screen</span></button>
      </div>
      <div class="n-carousel__close">
        <button><span>Close modal</span></button>
      </div>
    `;
    carousel.appendChild(controls);
  }

  return carousel;
}

/**
 * Waits for the carousel to initialize
 */
export function waitForInit(carousel, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkReady = () => {
      const content = carousel.querySelector('.n-carousel__content');
      if (content && content.dataset.ready === 'true') {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Carousel initialization timeout'));
      } else {
        requestAnimationFrame(checkReady);
      }
    };
    checkReady();
  });
}

/**
 * Triggers a scroll event on an element
 */
export function triggerScroll(element, scrollLeft = 0, scrollTop = 0) {
  Object.defineProperty(element, 'scrollLeft', {
    writable: true,
    value: scrollLeft,
  });
  Object.defineProperty(element, 'scrollTop', {
    writable: true,
    value: scrollTop,
  });
  element.dispatchEvent(new Event('scroll', { bubbles: true }));
}

/**
 * Waits for a scrollend event
 */
export function waitForScrollEnd(element, timeout = 500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('scrollend timeout'));
    }, timeout);
    element.addEventListener('scrollend', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
    // Trigger scrollend manually if polyfill doesn't fire
    setTimeout(() => {
      element.dispatchEvent(new Event('scrollend', { bubbles: true }));
    }, 150);
  });
}

/**
 * Gets the active slide index
 */
export function getActiveSlideIndex(carousel) {
  const content = carousel.querySelector('.n-carousel__content');
  if (!content) return -1;
  
  const activeSlide = content.querySelector('[aria-current="true"]');
  if (activeSlide) {
    return Array.from(content.children).indexOf(activeSlide);
  }
  
  // Fallback: check scroll position
  const slides = Array.from(content.children);
  const scrollLeft = content.scrollLeft;
  const slideWidth = content.offsetWidth;
  
  return Math.round(scrollLeft / slideWidth);
}

