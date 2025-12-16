/**
 * Observer functions
 * Separate file to avoid circular dependency with carousel.js
 */

import { isEndless, isVertical, isAutoHeight } from '../utils/checks.js';
import { getIndexReal } from '../utils/checks.js';
import { scrollTo } from '../utils/scroll.js';
import { nextSlideHeight } from '../utils/dimensions.js';
import { subpixelObserver, mutationObserver, heightMinusIndexObserver } from './index.js';
import { scrollAnimate } from '../core/animation.js';
import { updateCarousel } from '../core/carousel.js';

/**
 * Handle auto-height scroll end
 * @param {HTMLElement} carousel - Carousel content element
 * @param {HTMLElement} slide - Target slide
 * @param {number} index - Slide index
 */
const handleAutoHeightScrollEnd = (carousel, slide, index) => {
  const oldHeight = parseFloat(getComputedStyle(carousel).height);
  let newHeight;
  let offsetY = 0;

  if (isVertical(carousel)) {
    const scrollOffset = carousel.scrollTop;
    slide.style.height = 'auto';
    const computedMaxHeight = getComputedStyle(carousel).maxHeight;
    const maxHeight = computedMaxHeight.match(/px/)
      ? Math.ceil(parseFloat(computedMaxHeight))
      : 99999;
    newHeight = Math.min(
      Math.ceil(parseFloat(getComputedStyle(slide).height)),
      maxHeight
    );
    slide.style.height = '';
    carousel.scrollTop = scrollOffset;
    offsetY = index * newHeight - carousel.scrollTop;
  } else {
    newHeight = nextSlideHeight(slide);
  }

  if (oldHeight === newHeight) {
    newHeight = false;
  }

  window.requestAnimationFrame(() => {
    scrollAnimate(carousel, 0, offsetY, newHeight, oldHeight);
  });
};

/**
 * Handle scroll end event
 * @param {Event} e - Scroll event
 */
export function scrollEndAction(e) {
  const carousel = e.target || e;
  if (!carousel) return;

  const index = Math.abs(
    Math.round(
      isVertical(carousel)
        ? carousel.scrollTop /
            (carousel.offsetHeight -
              parseFloat(getComputedStyle(carousel).paddingBlockStart) -
              parseFloat(getComputedStyle(carousel).paddingBlockEnd))
        : carousel.scrollLeft /
            (carousel.offsetWidth -
              parseFloat(getComputedStyle(carousel).paddingInlineStart) -
              parseFloat(getComputedStyle(carousel).paddingInlineEnd))
    )
  );

  const slide = carousel.children[index];
  if (
    carousel.parentNode.sliding ||
    (carousel.dataset.next &&
      parseInt(carousel.dataset.next) !== [...carousel.children].indexOf(slide))
  ) {
    return;
  }

  carousel.parentNode.dataset.sliding = true;
  delete carousel.dataset.next;
  observersOff(carousel);

  const timeout = setTimeout(() => {
    if (isAutoHeight(carousel)) {
      // Handle auto-height scroll end
      handleAutoHeightScrollEnd(carousel, slide, index);
    } else {
      window.requestAnimationFrame(() => {
        updateCarousel(carousel);
      });
    }
  }, 10);

  // Store timeout for cleanup if needed
  carousel._scrollEndTimeout = timeout;
}

/**
 * Turn observers off for an element
 * @param {HTMLElement} el - Carousel content element
 */
export function observersOff(el) {
  if (!el) return;

  heightMinusIndexObserver.unobserve(el.parentNode);
  subpixelObserver.unobserve(el);
  el.observerStarted = true;
  el.removeEventListener('scrollend', scrollEndAction);
}

/**
 * Turn observers on for an element
 * @param {HTMLElement} el - Carousel content element
 */
export function observersOn(el) {
  if (!el) return;

  window.requestAnimationFrame(() => {
    // Restore saved scroll position
    if (el.scroll_x !== undefined && el.scroll_y !== undefined) {
      scrollTo(el, el.scroll_x, el.scroll_y);
      delete el.scroll_x;
      delete el.scroll_y;
    }

    // Height minus index observer for outside controls
    if (
      el.parentNode.matches(
        '.n-carousel--vertical.n-carousel--controls-outside.n-carousel--auto-height'
      )
    ) {
      heightMinusIndexObserver.observe(el.parentNode);
    } else {
      heightMinusIndexObserver.unobserve(el.parentNode);
    }

    // Start observers
    subpixelObserver.observe(el);
    mutationObserver.observe(el.parentNode, {
      attributes: true,
      attributeFilter: ['class']
    });

    el.addEventListener('scrollend', scrollEndAction);

    // Clear sliding flag
    delete el.parentNode.dataset.sliding;

    // Safari scrollend polyfill workaround
    if (!('onscrollend' in window) && isEndless(el)) {
      const index = getIndexReal(el);
      scrollTo(
        el,
        el.offsetWidth * index,
        el.offsetHeight * index
      );
    }
  });
}

