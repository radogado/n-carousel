/**
 * Scroll animation
 * Handles smooth scrolling animations
 */

import { scrollTo, getScroll } from '../utils/scroll.js';
import { inOutSine, DEFAULT_DURATION } from '../utils/animation.js';
import { isVertical, isAutoHeight } from '../utils/checks.js';
import { updateCarousel } from './carousel.js';

/**
 * Animate scroll with optional height change
 * @param {HTMLElement} el - Element to animate
 * @param {number} distanceX - X distance to scroll
 * @param {number} distanceY - Y distance to scroll
 * @param {number|false} newHeight - New height (false if no change)
 * @param {number} oldHeight - Old height
 * @returns {Promise<HTMLElement>} Promise that resolves when animation completes
 */
export const scrollAnimate = (
  el,
  distanceX,
  distanceY,
  newHeight,
  oldHeight = false
) => {
  return new Promise((resolve) => {
    if (!el) {
      resolve(el);
      return;
    }

    const wrapper = el.closest('.n-carousel');
    if (!wrapper) {
      resolve(el);
      return;
    }

    // Skip animation if instant or reduced motion
    if (
      wrapper.nextSlideInstant ||
      !wrapper.dataset.ready ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      wrapper.matches('.n-carousel--instant')
    ) {
      const scroll = getScroll(el);
      scrollTo(el, scroll.x + distanceX, scroll.y + distanceY);
      if (newHeight) {
        el.style.height = `${newHeight}px`;
      }
      delete wrapper.nextSlideInstant;
      updateCarousel(el);
      resolve(el);
      return;
    }

    // Prepare for animation
    const scrollChanging = !(distanceX === 0 && distanceY === 0);

    if (newHeight) {
      el.style.height = `${oldHeight}px`;
      if (isVertical(el) && isAutoHeight(el)) {
        el.style.setProperty('--subpixel-compensation', 0);
      }
    } else {
      if (!isVertical(el)) {
        el.style.height = '';
      }
    }

    const startX = getScroll(el).x;
    const startY = getScroll(el).y;
    const startH = parseInt(el.style.height) || 0;
    const distanceH = newHeight ? newHeight - startH : 0;
    const duration =
      parseFloat(el.parentNode.dataset.duration) * 1000 || DEFAULT_DURATION;

    let start = null;
    let end = null;

    const startAnim = (timeStamp) => {
      start = timeStamp;
      end = start + duration;
      draw(timeStamp);
    };

    const draw = (now) => {
      if (now - start >= duration) {
        // Animation complete
        window.requestAnimationFrame(() => {
          scrollTo(el, startX + distanceX, startY + distanceY);
          if (newHeight) {
            el.style.height = `${newHeight}px`;
          }
          updateCarousel(el);
        });
        resolve(el);
        return;
      }

      const progress = (now - start) / duration;
      const eased = inOutSine(progress);
      const x = startX + distanceX * eased;
      const y = startY + distanceY * eased;

      if (scrollChanging) {
        scrollTo(el, x, y);
      }

      if (newHeight) {
        window.requestAnimationFrame(() => {
          el.style.height = `${startH + distanceH * eased}px`;
        });
      }

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(startAnim);
  });
};

