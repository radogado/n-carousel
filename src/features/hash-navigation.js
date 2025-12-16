/**
 * Hash navigation feature
 * Handles URL hash-based navigation
 */

import { isSafari } from '../utils/browser.js';
import { scrollTo } from '../utils/scroll.js';
import { slideTo } from '../core/navigation.js';
import { closeModal } from './modal.js';

/**
 * Handle hash navigation
 * @param {PopStateEvent} e - Popstate event
 */
export const hashNavigation = (e) => {
  if (location.hash) {
    const el = document.querySelector(location.hash);
    const carousel = el?.parentNode;

    if (
      carousel &&
      carousel.classList.contains('n-carousel__content') &&
      !carousel.parentNode.closest('.n-carousel__content')
    ) {
      // Close other modals
      const modalCarousel = document.querySelector(
        '.n-carousel--overlay > .n-carousel__content'
      );
      if (modalCarousel && modalCarousel !== carousel) {
        closeModal(modalCarousel);
      }

      // Handle inline carousels
      if (carousel.parentNode.classList.contains('n-carousel--inline')) {
        closeModal(carousel);
      }

      // Safari workaround
      if (isSafari()) {
        scrollTo(
          carousel,
          carousel.offsetWidth * carousel.dataset.x,
          carousel.offsetHeight * carousel.dataset.y
        );
      }

      slideTo(carousel, [...carousel.children].indexOf(el));
      window.nCarouselNav = [carousel, location.hash];
    }
  } else {
    // Clear hash navigation
    if (window.nCarouselNav) {
      const carousel = window.nCarouselNav[0];
      delete window.nCarouselNav;

      if (isSafari()) {
        scrollTo(
          carousel,
          carousel.offsetWidth * carousel.dataset.x,
          carousel.offsetHeight * carousel.dataset.y
        );
      }

      const firstSlide = carousel.querySelector(':scope > :not([id])');
      if (firstSlide) {
        slideTo(carousel, [...carousel.children].indexOf(firstSlide));
      }
    }
  }
};

