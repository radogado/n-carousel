/**
 * Subpixel handling
 * Manages subpixel rendering issues and padding
 */

import { isVertical } from '../utils/checks.js';
import { getIndexReal } from '../utils/checks.js';
import { ceilingWidth, ceilingHeight } from '../utils/dimensions.js';
import { scrollTo } from '../utils/scroll.js';

/**
 * Update subpixel compensation
 * @param {HTMLElement} el - Carousel content element
 */
export const updateSubpixels = (el) => {
  if (!el || el.parentNode.dataset.sliding) return;

  const carousel = el;

  // Reset padding
  carousel.style.padding = '';
  carousel.style.removeProperty('--peek-int');

  // Set integer padding
  const isVert = isVertical(carousel);
  const padding = isVert
    ? `${parseInt(getComputedStyle(carousel).paddingBlockStart)}px 0`
    : `0 ${parseInt(getComputedStyle(carousel).paddingInlineStart)}px`;

  if (padding !== '0px') {
    carousel.style.padding = padding;
    // Safari workaround for inline end padding
    carousel.style.setProperty(
      '--peek-int',
      isVert
        ? `${parseInt(getComputedStyle(carousel).paddingBlockStart)}px 0 0 0`
        : `0 ${parseInt(getComputedStyle(carousel).paddingInlineStart)}px 0 0`
    );
  }

  window.requestAnimationFrame(() => {
    // Calculate subpixel compensation
    const rect = carousel.getBoundingClientRect();
    const compensation = isVert
      ? Math.ceil(rect.height) - rect.height
      : Math.ceil(rect.width) - rect.width;

    carousel.style.setProperty('--subpixel-compensation', compensation);

    // Update scroll position
    const offset = getIndexReal(carousel);
    scrollTo(
      carousel,
      offset * ceilingWidth(carousel.firstElementChild),
      offset * ceilingHeight(carousel.firstElementChild)
    );
  });
};


