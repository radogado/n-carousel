/**
 * Dimension utility functions
 * Optimized for performance with caching where appropriate
 */

/**
 * Get ceiling width of an element
 * @param {HTMLElement} el - Element to measure
 * @returns {number} Ceiling width
 */
export const ceilingWidth = (el) => {
  if (!el) return 0;
  return Math.ceil(parseFloat(getComputedStyle(el).width));
};

/**
 * Get ceiling height of an element
 * @param {HTMLElement} el - Element to measure
 * @returns {number} Ceiling height
 */
export const ceilingHeight = (el) => {
  if (!el) return 0;
  return Math.ceil(parseFloat(getComputedStyle(el).height));
};

/**
 * Get padding X (inline start + end)
 * @param {HTMLElement} el - Element to measure
 * @returns {number} Total horizontal padding
 */
export const paddingX = (el) => {
  if (!el) return 0;
  return parseInt(getComputedStyle(el).paddingInlineStart) * 2;
};

/**
 * Get padding Y (block start + end)
 * @param {HTMLElement} el - Element to measure
 * @returns {number} Total vertical padding
 */
export const paddingY = (el) => {
  if (!el) return 0;
  return parseInt(getComputedStyle(el).paddingBlockStart) * 2;
};

/**
 * Calculate next slide height for auto-height feature
 * @param {HTMLElement} el - Slide element
 * @returns {number} Calculated height
 */
export const nextSlideHeight = (el) => {
  if (!el) return 0;
  el.style.height = '0';
  el.style.overflow = 'auto';
  const height = el.scrollHeight;
  el.style.height = '';
  el.style.overflow = '';
  return height;
};

