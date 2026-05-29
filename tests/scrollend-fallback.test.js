import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCarousel,
  mockCarouselLayout,
  triggerScroll,
  getActiveSlideIndex,
} from './utils.js';

const SCROLL_END_FALLBACK_MS = 100;

function installCarouselTestEnv() {
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .n-carousel { width: 500px; height: 300px; overflow: hidden; }
    .n-carousel__content {
      display: flex; width: 100%; height: 100%;
      overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: auto;
    }
    .n-carousel__content > li {
      flex: 0 0 100%; scroll-snap-align: center; width: 500px; height: 300px;
    }
  `;
  document.head.appendChild(style);

  vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const style = {
      width: '500px',
      height: '300px',
      direction: 'ltr',
      visibility: 'visible',
      paddingInlineStart: '0px',
      paddingInlineEnd: '0px',
      paddingBlockStart: '0px',
      paddingBlockEnd: '0px',
      maxHeight: 'none',
    };
    if (el?.classList?.contains('n-carousel__index')) {
      style.width = '500px';
    }
    return style;
  });
}

describe('Scrollend fallback (no native scrollend)', () => {
  let container;
  let hadOnScrollEnd;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    installCarouselTestEnv();

    hadOnScrollEnd = 'onscrollend' in window;
    if (hadOnScrollEnd) {
      delete window.onscrollend;
    }
  });

  it('syncs active slide after scroll via debounced scroll fallback', async () => {
    const carousel = createCarousel({
      slides: 3,
      classes: 'n-carousel--instant',
    });
    carousel.setAttribute('data-duration', '0.01');
    container.appendChild(carousel);

    const content = carousel.querySelector('.n-carousel__content');
    mockCarouselLayout(content);

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(carousel.dataset.ready).toBe('true');

    expect(getActiveSlideIndex(carousel)).toBe(0);

    triggerScroll(content, 500, 0);
    content.dispatchEvent(new Event('scroll', { bubbles: true }));

    await new Promise((resolve) =>
      setTimeout(resolve, SCROLL_END_FALLBACK_MS + 50)
    );

    const activeIndex = getActiveSlideIndex(carousel);
    expect(activeIndex === 1 || content.querySelector('[aria-current="true"]')).toBeTruthy();
  });
});
