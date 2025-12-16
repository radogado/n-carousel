/**
 * Event handlers
 * Handles user interactions and keyboard navigation
 */

import { isRTL } from '../utils/browser.js';
import { closestCarousel } from '../utils/dom.js';
import { indexControls } from '../utils/dom.js';
import { isEndless, isModal, getIndex } from '../utils/checks.js';
import { slideTo, slideNext, slidePrevious } from '../core/navigation.js';
import { openModal } from '../features/modal.js';
import { scrollTo } from '../utils/scroll.js';
import { updateCarousel } from '../core/carousel.js';
import { closeModal } from '../features/modal.js';
import { toggleFullScreen } from '../features/fullscreen.js';

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} e - Keyboard event
 */
export const handleCarouselKeys = (e) => {
  const carousel = e.target
    .closest('.n-carousel')
    ?.querySelector(':scope > .n-carousel__content');
  
  if (!carousel) return;

  const keys = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End'
  ];

  if (!keys.includes(e.key)) return;

  switch (e.key) {
    case 'ArrowLeft':
      isRTL(carousel) ? slideNext(carousel) : slidePrevious(carousel);
      break;
    case 'ArrowRight':
      isRTL(carousel) ? slidePrevious(carousel) : slideNext(carousel);
      break;
    case 'ArrowUp':
    case 'PageUp':
      slidePrevious(carousel);
      break;
    case 'ArrowDown':
    case 'PageDown':
      slideNext(carousel);
      break;
    case 'Home':
      slideTo(carousel, 0);
      break;
    case 'End':
      slideTo(carousel, carousel.children.length - 1);
      break;
  }
};

/**
 * Handle escape key for modal closing
 * @param {KeyboardEvent} e - Keyboard event
 */
export const handleEscapeKey = (e) => {
  if (e.key !== 'Escape') return;

  let el = e.target;
  if (!el.closest('.n-carousel--overlay')) {
    el = document.querySelector('.n-carousel--overlay');
  }

  if (el) {
    closeModal(el);
  }
};

/**
 * Handle previous button click
 * @param {Event} e - Click event
 */
export const handlePreviousClick = (e) => {
  const carousel = closestCarousel(e.target.closest('[class*="n-carousel"]'));
  if (carousel) {
    slidePrevious(carousel);
  }
};

/**
 * Handle next button click
 * @param {Event} e - Click event
 */
export const handleNextClick = (e) => {
  const carousel = closestCarousel(e.target.closest('[class*="n-carousel"]'));
  if (carousel) {
    slideNext(carousel);
  }
};

/**
 * Handle index/thumbnail click
 * @param {Event} e - Click event
 */
export const handleIndexClick = (e) => {
  const el = e.target.closest('a, button');
  if (!el || (el.href && (e.ctrlKey || e.metaKey))) return;

  const wrapper =
    document.querySelector(`.n-carousel#${el.parentNode.dataset.for}`) ||
    el.closest('.n-carousel');
  
  if (!wrapper) return;

  const carousel = wrapper.querySelector(':scope > .n-carousel__content');
  if (!carousel) return;

  let newIndex = [...indexControls(el.parentNode)].indexOf(el);

  // Handle endless mode index adjustment
  if (isEndless(carousel)) {
    const oldIndex = getIndex(carousel);
    if (oldIndex === 0) {
      if (newIndex === carousel.children.length - 1) {
        newIndex = 0;
      } else {
        newIndex++;
      }
    }
    if (oldIndex === carousel.children.length - 1) {
      if (newIndex === 0) {
        newIndex = carousel.children.length - 1;
      } else {
        newIndex--;
      }
    }
  }

  // Handle inline carousel opening
  if (wrapper.classList.contains('n-carousel--inline') && !isModal(carousel)) {
    wrapper.nextSlideInstant = true;
    openModal(carousel);
    window.requestAnimationFrame(() => {
      carousel.dataset.x = carousel.dataset.y = newIndex;
      scrollTo(
        carousel,
        carousel.offsetWidth * carousel.dataset.x,
        carousel.offsetHeight * carousel.dataset.y
      );
      document.body.dataset.frozen = document.body.scrollTop;
      updateCarousel(carousel);
    });
  } else {
    window.requestAnimationFrame(() => {
      slideTo(carousel, newIndex);
    });
  }

  return false;
};

/**
 * Handle close modal button click
 * @param {Event} e - Click event
 */
export const handleCloseModalClick = (e) => {
  const wrapper = e.target.closest('.n-carousel');
  if (!wrapper) return;

  if (wrapper.classList.contains('n-carousel--overlay')) {
    closeModal(e.target);
  } else {
    openModal(e.target);
  }
};

/**
 * Handle fullscreen button click
 * @param {Event} e - Click event
 */
export const handleFullscreenClick = (e) => {
  const carousel = e.target
    .closest('.n-carousel')
    ?.querySelector(':scope > .n-carousel__content');
  
  if (carousel) {
    carousel.dataset.xx = carousel.dataset.x;
    carousel.dataset.yy = carousel.dataset.y;
    toggleFullScreen(e.target);
  }
};

