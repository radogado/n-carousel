/**
 * DOM utility functions
 * Optimized DOM queries and manipulations
 */

/**
 * Get control element (previous, next, index, etc.)
 * Supports detached controls via data-for attribute
 * @param {HTMLElement} carousel - Carousel wrapper element
 * @param {string} control - Control selector
 * @returns {HTMLElement|null} Control element or null
 */
export const getControl = (carousel, control) => {
  if (!carousel) return null;
  
  // Check for detached control
  const detachedControl = document.querySelector(
    `${control}[data-for="${carousel.id}"]`
  );
  if (detachedControl) {
    return detachedControl;
  }
  
  // Check direct children first (most common case)
  for (const el of carousel.children) {
    if (el.matches(control)) {
      return el;
    }
    // Check nested controls
    if (!el.matches('.n-carousel__content') && el.querySelector(control)) {
      return el.querySelector(control);
    }
  }
  
  return null;
};

/**
 * Find closest carousel content element
 * @param {HTMLElement} el - Starting element
 * @returns {HTMLElement|null} Carousel content element
 */
export const closestCarousel = (el) => {
  if (!el) return null;
  
  const carouselEl = el.closest('[class*="n-carousel"]');
  if (!carouselEl) return null;
  
  const relatedById = carouselEl.dataset?.for;
  if (relatedById) {
    const targetCarousel = document.getElementById(relatedById);
    return targetCarousel?.querySelector('.n-carousel__content') || null;
  }
  
  const carousel = el.closest('.n-carousel');
  return carousel?.querySelector('.n-carousel__content') || null;
};

/**
 * Get index controls (buttons/links in index)
 * @param {HTMLElement} index - Index container element
 * @returns {NodeList|Array} Index control elements
 */
export const indexControls = (index) => {
  if (!index) return [];
  
  const controlsByClass = index.querySelectorAll('.n-carousel__control');
  return controlsByClass.length > 0
    ? controlsByClass
    : index.querySelectorAll('a, button');
};

