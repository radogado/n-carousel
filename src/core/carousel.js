/**
 * Core carousel update logic
 * Handles carousel state updates and slide management
 */

import { isVertical, isAutoHeight, isEndless, getIndex, getIndexReal } from '../utils/checks.js';
import { isSafari } from '../utils/browser.js';
import { ceilingWidth, ceilingHeight, nextSlideHeight, paddingY } from '../utils/dimensions.js';
import { scrollStartX, scrollTo } from '../utils/scroll.js';
import { getControl } from '../utils/dom.js';
import { handleEndlessPositioning, restoreDisplacedSlides } from '../features/endless.js';
import { observersOn, observersOff } from '../observers/observers.js';

/**
 * Update carousel state and active slide
 * @param {HTMLElement} el - Carousel content element
 * @param {boolean} forced - Force update even if same slide
 */
export const updateCarousel = (el, forced = false) => {
  if (!el || el.togglingFullScreen) return;

  observersOff(el);

  // Save current position
  const savedX = el.dataset.x;
  const savedY = el.dataset.y;

  // Calculate new position
  const firstChild = el.firstElementChild;
  if (!firstChild) return;

  el.dataset.x = Math.abs(
    Math.round(scrollStartX(el) / ceilingWidth(firstChild))
  );
  el.dataset.y = Math.abs(
    Math.round(el.scrollTop / ceilingHeight(firstChild))
  );

  // Handle NaN values (inline carousels)
  if (el.dataset.x === 'NaN') el.dataset.x = 0;
  if (el.dataset.y === 'NaN') el.dataset.y = 0;

  let activeIndex = getIndex(el);
  if (activeIndex >= el.children.length) {
    activeIndex = el.children.length - 1;
  }

  const oldActiveSlide = el.querySelector(':scope > [aria-current]');
  const wrapper = el.parentElement;

  // Reset height if not auto-height
  if (!isAutoHeight(wrapper)) {
    el.style.height = '';
  }

  const activeSlide = el.children[activeIndex];
  if (!activeSlide) return;

  // Skip update if same slide (unless forced)
  if (oldActiveSlide && !forced && activeSlide === oldActiveSlide) {
    el.dataset.x = savedX;
    el.dataset.y = savedY;
    observersOn(el);
    return;
  }

  // Update old active slide
  if (oldActiveSlide) {
    oldActiveSlide.removeAttribute('aria-current');
    oldActiveSlide.setAttribute('aria-selected', 'false');
    oldActiveSlide.style.height = '';
    if (!isVertical(el)) {
      el.style.height = '';
    }
  }

  // Set new active slide
  activeSlide.setAttribute('aria-current', 'true');
  activeSlide.setAttribute('aria-selected', 'true');
  let activeIndexReal = getIndexReal(el);
  el.dataset.x = el.dataset.y = activeIndexReal;

  // Handle endless carousel positioning
  wrapper.dataset.sliding = true;
  if (isEndless(el) && !forced) {
    activeIndexReal = handleEndlessPositioning(el, activeIndex);
  } else {
    // Restore displaced slides if endless was disabled
    activeIndex = restoreDisplacedSlides(el, activeIndex);
    activeIndexReal = Math.max(
      0,
      [...el.children].indexOf(el.querySelector(':scope > [aria-current]'))
    );
  }

  // Update height CSS variable
  activeSlide.style.height = '';
  const height = isAutoHeight(el)
    ? nextSlideHeight(activeSlide)
    : activeSlide.scrollHeight;
  wrapper.style.setProperty('--height', `${height}px`);

  // Handle vertical auto-height initialization
  window.requestAnimationFrame(() => {
    if (!el.parentNode.dataset.ready && isAutoHeight(el) && isVertical(el)) {
      el.style.height = `${
        parseFloat(getComputedStyle(el).height) - paddingY(el)
      }px`;
    }
  });

  // Update URL hash if slide has ID
  if (getComputedStyle(el).visibility !== 'hidden') {
    const previouslyActive = document.activeElement;
    const hash = activeSlide.id;

    if (
      el.parentNode.dataset.ready &&
      hash &&
      !el.parentNode.closest('.n-carousel__content')
    ) {
      location.hash = `#${hash}`;
    }

    if (
      el.parentNode.dataset.ready &&
      !hash &&
      !el.parentNode.closest('.n-carousel__content') &&
      window.nCarouselNav
    ) {
      location.hash = '';
    }

    previouslyActive?.focus();
  }

  // Update index controls
  const index = getControl(el.closest('.n-carousel'), '.n-carousel__index');
  if (index) {
    index.querySelectorAll(':scope > *').forEach((tab, i) => {
      if (i === activeIndexReal) {
        tab.setAttribute('aria-current', 'true');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.removeAttribute('aria-current');
        tab.setAttribute('aria-selected', 'false');
      }
    });
  }

  // Set inert attribute on non-active slides
  [...el.children].forEach((slide) => {
    slide.inert = slide !== activeSlide;
    
    // Safari fullscreen bug workaround
    if (isSafari() && slide.querySelector('.n-carousel:-webkit-full-screen')) {
      const current = el.parentNode.querySelector(':scope > [aria-current="true"]');
      if (current) {
        current.inert = true;
        current.removeAttribute('aria-current');
        current.setAttribute('aria-selected', 'false');
      }
      slide.inert = false;
      slide.setAttribute('aria-current', 'true');
      slide.setAttribute('aria-selected', 'true');
    }
  });

  // Fix vertical auto-height scroll position
  if (/--vertical.*--auto-height/.test(wrapper.classList)) {
    el.scrollTop = el.offsetHeight * activeIndexReal;
  }

  window.requestAnimationFrame(() => {
    observersOn(el);
  });
};

