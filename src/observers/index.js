/**
 * Observer management
 * Handles ResizeObserver, MutationObserver, and scroll events
 */

import { isEndless, isVertical, isAutoHeight } from '../utils/checks.js';
import { getIndexReal } from '../utils/checks.js';
import { ceilingWidth, ceilingHeight, nextSlideHeight } from '../utils/dimensions.js';
import { scrollTo } from '../utils/scroll.js';
import { updateSubpixels } from './subpixels.js';
// Import observer functions from separate file to avoid circular dependency
import { observersOn, observersOff, scrollEndAction } from './observers.js';
// Import after other modules to handle circular dependency
// These will be hoisted by the bundler
import { updateCarousel } from '../core/carousel.js';
import { scrollAnimate } from '../core/animation.js';

/**
 * Auto-height observer for responsive height changes
 */
export const autoHeightObserver = new ResizeObserver((entries) => {
  window.requestAnimationFrame(() => {
    entries.forEach((entry) => {
      const slide = entry.target.querySelector(':scope > [aria-current]');
      const el = slide?.closest('.n-carousel__content');
      if (!el || el.parentElement.dataset.sliding) return;

      el.parentNode.style.removeProperty('--height');

      if (isVertical(el)) {
        slide.style.height = 'auto';
        el.style.height = `${slide.scrollHeight}px`;
        slide.style.height = '';
        updateCarousel(el);
      } else {
        el.style.height = '';
        el.style.height = `${slide.scrollHeight}px`;
        updateCarousel(el, true);
      }
    });
  });
});

/**
 * Subpixel observer for handling subpixel rendering issues
 */
export const subpixelObserver = new ResizeObserver((entries) => {
  window.requestAnimationFrame(() => {
    entries.forEach((entry) => {
      const el = entry.target;
      if (el.observerStarted) {
        el.observerStarted = false;
        return;
      }
      updateObserver(el);
    });
  });
});

/**
 * Mutation observer for class changes
 */
export const mutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (
      mutation.target &&
      !mutation.target.nextSlideInstant &&
      !mutation.target.toggleModal
    ) {
      const carousel = mutation.target.querySelector(':scope > .n-carousel__content');
      if (carousel) {
      updateObserver(carousel);
      updateCarousel(carousel, true);
      delete mutation.target.toggleModal;
      }
    }
  }
});

/**
 * Height minus index observer for outside controls
 */
export const heightMinusIndexObserver = new ResizeObserver((entries) => {
  window.requestAnimationFrame(() => {
    entries.forEach((entry) => {
      const el = entry.target;
      setIndexWidth(el);
    });
  });
});

/**
 * Update observer state for an element
 * @param {HTMLElement} el - Carousel content element
 */
const updateObserver = (el) => {
  observersOff(el);
  const doUpdate = (element) => {
    updateSubpixels(element);
    window.requestAnimationFrame(() => {
      const activeSlide = element.querySelector(':scope > [aria-current]');
      if (!activeSlide) return;

      const currentHeight = activeSlide.scrollHeight + 'px';
      const previousHeight = getComputedStyle(element).getPropertyValue('--height');
      if (currentHeight !== previousHeight) {
        element.parentNode.style.setProperty('--height', currentHeight);
      }
      observersOn(element);
    });
  };
  doUpdate(el);
  el.querySelectorAll('.n-carousel__content').forEach(doUpdate);
};

/**
 * Set index width for outside controls
 * @param {HTMLElement} el - Carousel wrapper element
 */
const setIndexWidth = (el) => {
  const index = el.querySelector(':scope > .n-carousel__index');
  if (!index || el.dataset.sliding) return;

  el.style.removeProperty('--height-minus-index');
  index.style.position = 'absolute';
  el.style.setProperty('--height-minus-index', `${el.offsetHeight}px`);
  el.style.setProperty('--index-width', getComputedStyle(index).width);
  index.style.position = '';
};

// Re-export observersOn, observersOff, and scrollEndAction for external use
export { observersOn, observersOff, scrollEndAction } from './observers.js';

