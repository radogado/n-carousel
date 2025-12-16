/**
 * Core navigation functions
 * Handles sliding between slides
 */

import { isVertical, isAutoHeight, isModal, getIndexReal } from '../utils/checks.js';
import { isFullScreen, isRTL } from '../utils/browser.js';
import { scrollStartX } from '../utils/scroll.js';
import { ceilingWidth, ceilingHeight, nextSlideHeight, paddingX } from '../utils/dimensions.js';
import { scrollTo, getScroll } from '../utils/scroll.js';
import { DEFAULT_DURATION } from '../utils/animation.js';
import { scrollAnimate } from './animation.js';

/**
 * Internal slide function with offset calculation
 * @param {HTMLElement} el - Carousel content element
 * @param {number} offsetX - X offset
 * @param {number} offsetY - Y offset
 * @param {number} index - Target slide index
 */
const slide = (el, offsetX = 0, offsetY = 0, index) => {
  if (!el?.parentNode) return;

  clearTimeout(el.nCarouselTimeout);

  if (el.parentNode.dataset.sliding) return;

  el.parentNode.dataset.sliding = true;

  let oldHeight = el.children[getIndexReal(el)]?.offsetHeight || 0;
  let newHeight = oldHeight;

  // Calculate new height for auto-height mode
  if (isAutoHeight(el)) {
    const oldScrollLeft = scrollStartX(el);
    const oldScrollTop = el.scrollTop;
    const slide = el.children[index];

    if (isVertical(el)) {
      slide.style.height = 'auto';
      const computedMaxHeight = getComputedStyle(el).maxHeight;
      const maxHeight = computedMaxHeight.match(/px/)
        ? Math.ceil(parseFloat(computedMaxHeight))
        : 99999;
      newHeight = Math.min(
        Math.ceil(parseFloat(getComputedStyle(slide).height)),
        maxHeight
      );
      slide.style.height = '';
    } else {
      newHeight = nextSlideHeight(slide);
      const currentIndex = getIndexReal(el);
      if (currentIndex !== index) {
        const currentHeight = nextSlideHeight(el.children[currentIndex]);
        el.parentNode.style.setProperty('--height', `${currentHeight}px`);
      }
    }

    // iPad bug workaround
    scrollTo(el, oldScrollLeft + paddingX(el) / 2, oldScrollTop);
    scrollTo(el, oldScrollLeft, oldScrollTop);
  }

  // Adjust offset for vertical mode
  if (isVertical(el)) {
    if ((isModal(el) || isFullScreen()) && isAutoHeight(el)) {
      oldHeight = newHeight = el.offsetHeight;
    }
    offsetY = offsetY - index * oldHeight + index * newHeight;
  }

  window.requestAnimationFrame(() => {
    const hasDuration = el.parentNode.dataset.duration;
    const useAutoHeight = isAutoHeight(el);

    if (!hasDuration && !useAutoHeight) {
      // Use native smooth scroll
      delete el.parentNode.dataset.sliding;
      el.dataset.next = index;
      el.scrollTo({
        top: el.scrollTop + offsetY,
        left: el.scrollLeft + offsetX,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
      });
    } else {
      // Use custom animation
      scrollAnimate(
        el,
        offsetX,
        offsetY,
        newHeight === oldHeight ? false : newHeight,
        oldHeight
      );
    }
  });
};

/**
 * Navigate to specific slide
 * @param {HTMLElement} el - Carousel content element
 * @param {number} index - Target slide index
 */
export const slideTo = (el, index) => {
  if (!el?.children || !el.children[index]) {
    console.warn('Invalid element or index in slideTo');
    return;
  }

  if (isVertical(el)) {
    slide(
      el,
      0,
      ceilingHeight(el.children[index]) * index - el.scrollTop,
      index
    );
  } else {
    const targetElement = el.children[index];
    if (!targetElement?.offsetParent) {
      console.warn('Target element not ready for measurement');
      return;
    }

    const width = Math.ceil(parseFloat(getComputedStyle(targetElement).width));
    const currentX = scrollStartX(el);
    const newOffset = isRTL(el)
      ? Math.abs(currentX) - width * index
      : width * index - currentX;

    slide(el, newOffset, 0, index);
  }
};

/**
 * Navigate to next slide
 * @param {HTMLElement} el - Carousel content element
 */
export const slideNext = (el) => {
  if (!el) return;
  const index = getIndexReal(el);
  const maxIndex = el.children.length - 1;
  slideTo(el, index >= maxIndex ? 0 : index + 1);
};

/**
 * Navigate to previous slide
 * @param {HTMLElement} el - Carousel content element
 */
export const slidePrevious = (el) => {
  if (!el) return;
  const index = getIndexReal(el);
  const maxIndex = el.children.length - 1;
  slideTo(el, index === 0 ? maxIndex : index - 1);
};

