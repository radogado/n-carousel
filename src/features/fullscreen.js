/**
 * Fullscreen feature
 * Handles fullscreen API with browser compatibility
 */

import { isSafari, isFullScreen } from '../utils/browser.js';
import { scrolledAncestors } from '../utils/scroll.js';
import { isVertical, isAutoHeight } from '../utils/checks.js';
import { slideTo } from '../core/navigation.js';

/**
 * Toggle fullscreen mode for a carousel
 * @param {HTMLElement} el - Button element that triggered the action
 */
export const toggleFullScreen = (el) => {
  const carouselWrapper = el.closest('.n-carousel');
  if (!carouselWrapper) return;

  const carousel = carouselWrapper.querySelector(':scope > .n-carousel__content');
  if (!carousel) return;

  const restoreScroll = () => {
    if (!isFullScreen() && carouselWrapper.nuiAncestors) {
      carouselWrapper.nuiAncestors.forEach((ancestor) => {
        window.requestAnimationFrame(() => {
          ancestor.scrollLeft = ancestor.nuiScrollX;
          ancestor.scrollTop = ancestor.nuiScrollY;
          delete ancestor.nuiScrollX;
          delete ancestor.nuiScrollY;
        });
      });
      delete carouselWrapper.nuiAncestors;
      carouselWrapper.removeEventListener('webkitfullscreenchange', restoreScroll);
    }
  };

  carousel.togglingFullScreen = true;

  if (isFullScreen()) {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }

    if (isSafari()) {
      // Safari workaround for exit fullscreen
      setTimeout(() => {
        carouselWrapper.style.display = 'none';
        window.requestAnimationFrame(() => {
          carouselWrapper.style.display = '';
        });
      }, 0);
    }

    if (isVertical(carousel) && isAutoHeight(carousel)) {
      const updateExitFullScreen = () => {
        setTimeout(() => {
          const carouselContent = carouselWrapper.querySelector(':scope > .n-carousel__content');
          slideTo(carouselContent, parseInt(carouselContent.dataset.y));
        }, 100);
        carouselWrapper.removeEventListener('fullscreenchange', updateExitFullScreen);
      };
      carouselWrapper.addEventListener('fullscreenchange', updateExitFullScreen);
    }
  } else {
    // Enter fullscreen
    if (isSafari()) {
      carouselWrapper.nuiAncestors = scrolledAncestors(carouselWrapper);
      carouselWrapper.nuiAncestors.forEach((ancestor) => {
        ancestor.nuiScrollX = ancestor.scrollLeft;
        ancestor.nuiScrollY = ancestor.scrollTop;
      });
      carouselWrapper.addEventListener('webkitfullscreenchange', restoreScroll, false);
    }

    if (carouselWrapper.requestFullscreen) {
      carouselWrapper.requestFullscreen();
    } else if (carouselWrapper.webkitRequestFullscreen) {
      carouselWrapper.webkitRequestFullscreen();
    }
  }
};

