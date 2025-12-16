/**
 * Animation utility functions
 * Optimized easing and animation helpers
 */

/**
 * Easing function: in-out sine
 * @param {number} n - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export const inOutSine = (n) => (1 - Math.cos(Math.PI * n)) / 2;

/**
 * Default animation duration in milliseconds
 */
export const DEFAULT_DURATION = 500;

/**
 * Default auto-slide interval in milliseconds
 */
export const DEFAULT_INTERVAL = 4000;

