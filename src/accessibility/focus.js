/**
 * Focus management for accessibility
 * Handles focus trapping in modals
 */

const FOCUSABLE_ELEMENTS = 'button, [href], input, select, textarea, details, summary, video, [tabindex]:not([tabindex="-1"])';

let firstFocusableElement = null;
let focusableContent = null;
let lastFocusableElement = null;

/**
 * Handle keyboard focus navigation
 * @param {KeyboardEvent} e - Keyboard event
 */
const focusHandler = (e) => {
  const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
  if (!isTabPressed) return;

  if (e.shiftKey) {
    // Shift + Tab: focus last element when on first
    if (document.activeElement === firstFocusableElement) {
      lastFocusableElement?.focus();
      e.preventDefault();
    }
  } else {
    // Tab: focus first element when on last
    if (document.activeElement === lastFocusableElement) {
      firstFocusableElement?.focus();
      e.preventDefault();
    }
  }
};

/**
 * Trap focus inside a modal element
 * @param {HTMLElement} modal - Modal element
 * @param {boolean} off - If true, remove focus trap
 */
export const trapFocus = (modal, off = false) => {
  if (!modal) return;

  if (off) {
    modal.removeEventListener('keydown', focusHandler);
    firstFocusableElement = null;
    focusableContent = null;
    lastFocusableElement = null;
  } else {
    focusableContent = modal.querySelectorAll(FOCUSABLE_ELEMENTS);
    if (focusableContent.length === 0) return;

    firstFocusableElement = focusableContent[0];
    lastFocusableElement = focusableContent[focusableContent.length - 1];

    modal.addEventListener('keydown', focusHandler);
    firstFocusableElement?.focus();
  }
};

