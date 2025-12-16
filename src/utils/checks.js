/**
 * Carousel state check functions
 * Optimized with early returns and caching
 */

/**
 * Check if carousel is in endless mode
 * @param {HTMLElement} el - Carousel content element
 * @returns {boolean} True if endless
 */
export const isEndless = (el) => {
  if (!el?.parentElement) return false;
  return (
    el.children.length > 2 &&
    el.parentElement.classList.contains('n-carousel--endless')
  );
};

/**
 * Check if carousel is vertical
 * @param {HTMLElement} el - Carousel content element
 * @returns {boolean} True if vertical
 */
export const isVertical = (el) => {
  if (!el) return false;
  const carousel = el.closest('.n-carousel');
  return carousel?.matches('.n-carousel--vertical') || false;
};

/**
 * Check if carousel has auto-height
 * @param {HTMLElement} el - Carousel content or wrapper element
 * @returns {boolean} True if auto-height
 */
export const isAutoHeight = (el) => {
  if (!el) return false;
  const carousel = el.closest?.('.n-carousel') || el;
  return carousel?.matches('.n-carousel--auto-height') || false;
};

/**
 * Check if carousel is in modal/overlay mode
 * @param {HTMLElement} el - Carousel content element
 * @returns {boolean} True if modal
 */
export const isModal = (el) => {
  if (!el) return false;
  const carousel = el.closest('.n-carousel');
  return carousel?.classList.contains('n-carousel--overlay') || false;
};

/**
 * Get current slide index
 * @param {HTMLElement} el - Carousel content element
 * @returns {number} Current index
 */
export const getIndex = (el) => {
  if (!el) return 0;
  return 1 * (isVertical(el) ? (el.dataset.y || 0) : (el.dataset.x || 0));
};

/**
 * Get real slide index (handles endless mode)
 * @param {HTMLElement} el - Carousel content element
 * @returns {number} Real index
 */
export const getIndexReal = (el) => {
  if (!el) return 0;
  
  const activeSlide = el.querySelector(':scope > [aria-current]');
  if (activeSlide) {
    return [...el.children].indexOf(activeSlide);
  }
  
  // Check hash navigation
  if (location.hash) {
    const hashSlide = el.querySelector(`:scope > ${location.hash}`);
    if (hashSlide) {
      const index = [...el.children].indexOf(hashSlide);
      return index > -1 ? index : 0;
    }
  }
  
  return 0;
};

