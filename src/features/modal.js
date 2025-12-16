/**
 * Modal/overlay feature
 * Handles modal carousel display
 */

import { isFullScreen } from '../utils/browser.js';
import { closestCarousel } from '../utils/dom.js';
import { trapFocus } from '../accessibility/focus.js';

/**
 * Close modal carousel
 * @param {HTMLElement} el - Element that triggered close
 */
export const closeModal = (el) => {
  // Exit fullscreen if active
  if (isFullScreen()) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  const carousel = closestCarousel(el);
  if (!carousel) return;

  const wrapper = carousel.closest('.n-carousel');
  if (!wrapper) return;

  wrapper.toggleModal = true; // Skip mutation observer
  wrapper.classList.remove('n-carousel--overlay');
  trapFocus(wrapper, true); // Disable focus trap

  // Remove placeholder
  const placeholder = wrapper.nextElementSibling;
  if (placeholder?.classList.contains('n-carousel__overlay-placeholder')) {
    placeholder.remove();
  }

  delete document.body.dataset.frozen;
  document.body.removeEventListener('keyup', closeModalOnBodyClick);
};

/**
 * Open modal carousel
 * @param {HTMLElement} el - Element that triggered open
 */
export const openModal = (el) => {
  const carousel = closestCarousel(el);
  if (!carousel) return;

  const wrapper = carousel.closest('.n-carousel');
  if (!wrapper) return;

  wrapper.toggleModal = true; // Skip mutation observer

  // Create placeholder to maintain aspect ratio
  const rect = wrapper.getBoundingClientRect();
  const aspectRatio = rect.width / rect.height;
  wrapper.insertAdjacentHTML(
    'afterend',
    `<div class="n-carousel__overlay-placeholder" style="aspect-ratio: ${aspectRatio}"></div>`
  );

  wrapper.classList.add('n-carousel--overlay');
  trapFocus(wrapper);

  setTimeout(() => {
    document.body.addEventListener('keyup', closeModalOnBodyClick);
  }, 100);
};

/**
 * Handle escape key to close modal
 * @param {KeyboardEvent} e - Keyboard event
 */
const closeModalOnBodyClick = (e) => {
  const overlay = document.querySelector('.n-carousel--overlay');
  if (overlay && e.key === 'Escape') {
    closeModal(overlay);
  }
};

