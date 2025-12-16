/**
 * n-carousel main entry point
 * Modular carousel component
 */

import './scrollyfills.module.js'; // scrollend event polyfill
import { loadTranslations, areTranslationsLoaded } from './i18n/translations.js';
import { initAriaAttributes, updateAriaLabels } from './accessibility/aria.js';
import { getControl } from './utils/dom.js';
import { isAutoHeight, isVertical } from './utils/checks.js';
import { nextSlideHeight, paddingY } from './utils/dimensions.js';
import { updateSubpixels } from './observers/subpixels.js';
import { autoHeightObserver, observersOn } from './observers/index.js';
import { updateCarousel } from './core/carousel.js';
import { openModal } from './features/modal.js';
import { hashNavigation } from './features/hash-navigation.js';
import { initAutoSlide } from './features/auto-slide.js';
import {
  handleCarouselKeys,
  handleEscapeKey,
  handlePreviousClick,
  handleNextClick,
  handleIndexClick,
  handleCloseModalClick,
  handleFullscreenClick
} from './events/handlers.js';
import { toggleFullScreen } from './features/fullscreen.js';

/**
 * Initialize carousel
 * @param {Document|HTMLElement} host - Host element to search for carousels
 */
const init = async (host = document) => {
  // Load translations
  const htmlLang = document.documentElement.lang;
  const lang = htmlLang || 'en';
  await loadTranslations(lang);

  // Initialize all carousels
  host.querySelectorAll('.n-carousel:not([data-ready])').forEach((el) => {
    const previous = getControl(el, '.n-carousel__previous');
    const next = getControl(el, '.n-carousel__next');
    const index = getControl(el, '.n-carousel__index');
    const closeModal = getControl(el, '.n-carousel__close');
    const fullScreen = getControl(el, '.n-carousel__full-screen');
    const content = el.querySelector(':scope > .n-carousel__content');

    if (!content) return;

    // Attach event handlers
    if (previous) {
      previous.onclick = handlePreviousClick;
    }
    if (next) {
      next.onclick = handleNextClick;
    }
    if (index) {
      index.onclick = handleIndexClick;
    }
    if (closeModal) {
      closeModal.onclick = handleCloseModalClick;
    }
    if (fullScreen) {
      fullScreen.onclick = handleFullscreenClick;
    }

    // Keyboard navigation
    el.addEventListener('keydown', handleCarouselKeys);
    el.addEventListener('keyup', handleEscapeKey);

    // Initialize ARIA attributes
    initAriaAttributes(el, {
      previous,
      next,
      index,
      closeModal,
      fullScreen
    });

    // Update ARIA labels after translations are loaded
    if (areTranslationsLoaded()) {
      updateAriaLabels(el);
    }

    // Initialize subpixel handling
    updateSubpixels(content);
    content.observerStarted = true;

    // Handle hash navigation
    const hashedSlide = location.hash
      ? content.querySelector(`:scope > ${location.hash}`)
      : null;

    if (hashedSlide) {
      if (el.classList.contains('n-carousel--inline')) {
        openModal(content);
      }
      const slideIndex = [...hashedSlide.parentNode.children].indexOf(hashedSlide);
      if (isVertical(content)) {
        content.dataset.y = slideIndex;
      } else {
        content.dataset.x = slideIndex;
      }
      window.nCarouselNav = [content, location.hash];
    }

    // Initialize vertical auto-height
    if (el.matches('.n-carousel--vertical.n-carousel--auto-height')) {
      content.style.height = '';
      content.style.height = getComputedStyle(content).height;
      el.dataset.ready = true;
      content.scrollTop = 0;
    }

    // Initialize auto-height observer
    if (isAutoHeight(el)) {
      autoHeightObserver.observe(content);
    }

    // Final initialization
    window.requestAnimationFrame(() => {
      observersOn(content);

      if (
        el.parentNode.matches(
          '.n-carousel--vertical.n-carousel--controls-outside.n-carousel--auto-height'
        )
      ) {
        // Set index width for outside controls
        const indexEl = el.querySelector(':scope > .n-carousel__index');
        if (indexEl) {
          el.style.setProperty('--height-minus-index', `${el.offsetHeight}px`);
          el.style.setProperty('--index-width', getComputedStyle(indexEl).width);
        }
      }

      updateCarousel(content);
      el.dataset.ready = true;
      el.dataset.platform = navigator.platform;

      // Initialize auto-slide
      initAutoSlide(el, content);

      // Lightbox image loading
      if (el.matches('.n-carousel--lightbox')) {
        const loaded = (img) => {
          img.closest('picture').dataset.loaded = true;
        };
        content.querySelectorAll('picture img').forEach((img) => {
          if (img.complete) {
            loaded(img);
          } else {
            img.addEventListener('load', (e) => {
              loaded(e.target);
            });
          }
        });
      }

      // Update ARIA labels again after initialization
      updateAriaLabels(el);
    });

    // Expose update function
    content.nCarouselUpdate = updateCarousel;
  });
};

// Expose init function globally
window.nCarouselInit = init;

// Set up hash navigation
window.addEventListener('popstate', hashNavigation);

// Initialize on DOM ready
const doInit = () => {
  if (typeof nui !== 'undefined' && typeof nui.registerComponent === 'function') {
    nui.registerComponent('n-carousel', init);
  } else {
    init();
  }
};

if (document.readyState !== 'loading') {
  doInit();
} else {
  document.addEventListener('DOMContentLoaded', doInit);
}

export default init;

