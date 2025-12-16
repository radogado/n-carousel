/**
 * ARIA attributes management
 * Updates ARIA labels and roles for accessibility
 */

import { translate, areTranslationsLoaded } from '../i18n/translations.js';

/**
 * Update ARIA labels for a carousel element
 * @param {HTMLElement} el - Carousel wrapper element
 */
export const updateAriaLabels = (el) => {
  if (!el || !areTranslationsLoaded()) return;

  // Main carousel label
  el.setAttribute('aria-label', translate('carousel'));

  // Previous button
  const previous = el.querySelector('.n-carousel__previous button');
  if (previous) {
    previous.setAttribute('aria-label', translate('previous'));
  }

  // Next button
  const next = el.querySelector('.n-carousel__next button');
  if (next) {
    next.setAttribute('aria-label', translate('next'));
  }

  // Index/navigation
  const index = el.querySelector('.n-carousel__index');
  if (index) {
    index.setAttribute('aria-label', translate('navigation'));

    const buttons = index.querySelectorAll('button');
    buttons.forEach((tab, i) => {
      const total = buttons.length;
      tab.setAttribute('aria-label', translate('item', {
        current: i + 1,
        total: total
      }));
    });
  }

  // Content slides
  const content = el.querySelector('.n-carousel__content');
  if (content) {
    content.querySelectorAll(':scope > *').forEach((slide, i) => {
      const total = content.children.length;
      slide.setAttribute('aria-label', translate('current_item', {
        current: i + 1,
        total: total
      }));
    });
  }

  // Close modal button
  const closeModal = el.querySelector('.n-carousel__close button');
  if (closeModal) {
    closeModal.setAttribute('aria-label', translate('close'));
  }

  // Fullscreen button
  const fullScreen = el.querySelector('.n-carousel__full-screen button');
  if (fullScreen) {
    fullScreen.setAttribute('aria-label', translate('fullscreen'));
  }
};

/**
 * Initialize ARIA roles and attributes for a carousel
 * @param {HTMLElement} el - Carousel wrapper element
 * @param {Object} controls - Control elements object
 */
export const initAriaAttributes = (el, controls) => {
  if (!el) return;

  // Main carousel role
  el.setAttribute('role', 'region');

  const content = el.querySelector(':scope > .n-carousel__content');
  if (content) {
    content.setAttribute('role', 'list');
    content.setAttribute('aria-live', 'polite');
    content.setAttribute('aria-atomic', 'true');
    content.setAttribute('aria-relevant', 'all');
  }

  // Control roles
  if (controls.previous) {
    controls.previous.setAttribute('role', 'button');
  }
  if (controls.next) {
    controls.next.setAttribute('role', 'button');
  }
  if (controls.index) {
    controls.index.setAttribute('role', 'tablist');
    controls.index.querySelectorAll(':scope > *').forEach((tab) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', tab.hasAttribute('aria-current') ? 'true' : 'false');
    });
  }
  if (controls.closeModal) {
    controls.closeModal.setAttribute('role', 'button');
  }
  if (controls.fullScreen) {
    controls.fullScreen.setAttribute('role', 'button');
  }

  // Slide roles
  if (content) {
    content.querySelectorAll(':scope > *').forEach((slide) => {
      slide.setAttribute('role', 'listitem');
      if (slide.hasAttribute('aria-current')) {
        slide.setAttribute('aria-selected', 'true');
      }
    });
  }
};

