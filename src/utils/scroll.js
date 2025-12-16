/**
 * Scroll utility functions
 * Handles scroll operations with RTL support
 */

import { isRTL } from './browser.js';

/**
 * Get scroll start X position (handles RTL)
 * @param {HTMLElement} el - Element to get scroll position from
 * @returns {number} Scroll X position
 */
export const scrollStartX = (el) => {
  if (!el) return 0;
  return el.scrollLeft;
};

/**
 * Scroll to position with RTL support
 * @param {HTMLElement} el - Element to scroll
 * @param {number} x - X position
 * @param {number} y - Y position
 */
export const scrollTo = (el, x, y) => {
  if (!el) return;
  el.scrollTo(isRTL(el) ? -1 * Math.abs(x) : x, y);
};

/**
 * Get current scroll position
 * @param {HTMLElement|Window} el - Element or window
 * @returns {Object} Object with x and y properties
 */
export const getScroll = (el) => {
  if (el === window) {
    return {
      x: el.scrollX,
      y: el.scrollY
    };
  }
  return {
    x: scrollStartX(el),
    y: el.scrollTop
  };
};

/**
 * Find scrolled ancestor element
 * @param {HTMLElement} el - Starting element
 * @returns {HTMLElement|false} Scrolled ancestor or false
 */
export const scrolledAncestor = (el) => {
  if (!el) return false;
  el = el.parentNode;
  while (el) {
    if (el.scrollTop !== 0 || el.scrollLeft !== 0) {
      return el;
    }
    el = el.parentNode;
  }
  return false;
};

/**
 * Find all scrolled ancestors
 * @param {HTMLElement} el - Starting element
 * @returns {Array<HTMLElement>} Array of scrolled ancestors
 */
export const scrolledAncestors = (el) => {
  const arr = [];
  let a = scrolledAncestor(el);
  while (
    a &&
    typeof a.scrollLeft !== 'undefined' &&
    (a.scrollTop !== 0 || a.scrollLeft !== 0)
  ) {
    arr.push(a);
    a = scrolledAncestor(a);
  }
  return arr;
};

