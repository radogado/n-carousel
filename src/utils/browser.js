/**
 * Browser detection and compatibility utilities
 * Optimized to detect once and cache results
 */

// Cache browser detection results
let browserCache = null;

/**
 * Detect browser type and cache results
 * @returns {Object} Browser detection object
 */
const detectBrowser = () => {
  if (browserCache) return browserCache;
  
  const ua = navigator.userAgent;
  browserCache = {
    isChrome: !!ua.match('Chrome'),
    isSafari: ua.match(/Safari/) && !ua.match('Chrome'),
    platform: navigator.platform
  };
  
  return browserCache;
};

export const isChrome = () => detectBrowser().isChrome;
export const isSafari = () => detectBrowser().isSafari;
export const getPlatform = () => detectBrowser().platform;

/**
 * Check if element is in viewport
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} True if element is in viewport
 */
export const isElementInViewport = (el) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.offsetHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.offsetWidth)
  );
};

/**
 * Check if fullscreen is active
 * @returns {boolean} True if fullscreen is active
 */
export const isFullScreen = () => {
  return !!(document.webkitFullscreenElement || document.fullscreenElement);
};

/**
 * Check if element is RTL
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} True if RTL
 */
export const isRTL = (el) => {
  if (!el) return false;
  return getComputedStyle(el).direction === 'rtl';
};

