/**
 * Endless carousel feature
 * Handles infinite looping by duplicating slides
 */

import { isEndless } from '../utils/checks.js';
import { ceilingWidth, ceilingHeight } from '../utils/dimensions.js';
import { scrollTo } from '../utils/scroll.js';
import { isVertical } from '../utils/checks.js';

/**
 * Restore displaced slides in endless carousel
 * @param {HTMLElement} el - Carousel content element
 * @param {number} activeIndex - Current active index (modified in place)
 * @returns {number} Updated active index
 */
export const restoreDisplacedSlides = (el, activeIndex) => {
  let index = activeIndex;

  // Restore first slides
  el.querySelectorAll(':scope > [data-first]').forEach((el2) => {
    el.append(el.firstElementChild);
    delete el2.dataset.first;
    index--;
  });

  // Restore last slides
  el.querySelectorAll(':scope > [data-last]').forEach((el2) => {
    el.prepend(el.lastElementChild);
    delete el2.dataset.last;
    index++;
  });

  return index;
};

/**
 * Handle endless carousel slide positioning
 * @param {HTMLElement} el - Carousel content element
 * @param {number} activeIndex - Current active index
 * @returns {number} Real active index
 */
export const handleEndlessPositioning = (el, activeIndex) => {
  if (!isEndless(el)) return activeIndex;

  let activeIndexReal = activeIndex;
  const childrenLength = el.children.length;

  if (activeIndex === 0) {
    const firstSlide = el.firstElementChild;
    if (!firstSlide.dataset.first) {
      // Move last slide to front as [data-first]
      const lastSlide = el.lastElementChild;
      if (lastSlide.dataset.last) {
        delete lastSlide.dataset.last;
        activeIndexReal = 1;
      } else {
        lastSlide.dataset.first = true;
      }
      el.prepend(lastSlide);
      activeIndex = 1;
    } else {
      // Landed on fake first slide - restore to real last
      delete firstSlide.dataset.first;
      el.append(firstSlide);
      el.firstElementChild.dataset.last = true;
      el.append(el.firstElementChild);
      activeIndexReal = childrenLength - 1;
      activeIndex = childrenLength - 2;
    }
  } else if (activeIndex === childrenLength - 1) {
    const lastSlide = el.lastElementChild;
    if (!lastSlide.dataset.last) {
      // Move first slide to back as [data-last]
      const firstSlide = el.firstElementChild;
      if (firstSlide.dataset.first) {
        delete firstSlide.dataset.first;
        activeIndexReal = childrenLength - 2;
      } else {
        firstSlide.dataset.last = true;
      }
      el.append(firstSlide);
      activeIndex = childrenLength - 2;
    } else {
      // Landed on fake last slide - restore to real first
      delete lastSlide.dataset.last;
      el.prepend(lastSlide);
      el.lastElementChild.dataset.first = true;
      el.prepend(el.lastElementChild);
      activeIndexReal = 0;
      activeIndex = 1;
    }
  } else {
    // Middle slide - restore any displaced slides
    activeIndex = restoreDisplacedSlides(el, activeIndex);
    activeIndexReal = Math.max(0, [...el.children].indexOf(
      el.querySelector(':scope > [aria-current]')
    ));
  }

  // Update scroll position
  el.dataset.x = el.dataset.y = activeIndexReal;
  const scrollX = ceilingWidth(el.firstElementChild) * activeIndex;
  const scrollY = ceilingHeight(el.firstElementChild) * activeIndex;
  scrollTo(el, scrollX, scrollY);

  return activeIndexReal;
};

