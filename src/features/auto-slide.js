/**
 * Auto-slide feature
 * Automatically advances slides at intervals
 */

import { isElementInViewport } from '../utils/browser.js';
import { DEFAULT_INTERVAL, DEFAULT_DURATION } from '../utils/animation.js';
import { slideNext } from '../core/navigation.js';

/**
 * Initialize auto-slide for a carousel
 * @param {HTMLElement} el - Carousel wrapper element
 * @param {HTMLElement} content - Carousel content element
 */
export const initAutoSlide = (el, content) => {
  if (!el.matches('.n-carousel--auto-slide')) return;

  const interval = parseFloat(el.dataset.interval) * 1000 || DEFAULT_INTERVAL;
  const duration = parseFloat(el.dataset.duration) * 1000 || DEFAULT_DURATION;
  const autoDelay = interval + duration;

  const carouselTimeout = () => {
    if (isElementInViewport(content)) {
      slideNext(content);
    }
    content.nCarouselTimeout = setTimeout(carouselTimeout, autoDelay);
  };

  content.nCarouselTimeout = setTimeout(carouselTimeout, interval);

  // Pause on hover
  content.addEventListener('pointerenter', () => {
    clearTimeout(content.nCarouselTimeout);
  });

  // Resume on leave
  content.addEventListener('pointerleave', () => {
    content.nCarouselTimeout = setTimeout(carouselTimeout, interval);
  });
};


