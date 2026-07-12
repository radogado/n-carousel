import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCarousel, getActiveSlideIndex } from './utils.js';

function mockVerticalCarouselLayout(content, slideHeight = 300) {
  content.scrollTo = (x, y) => {
    if (typeof x === 'object') {
      content.scrollLeft = x.left ?? content.scrollLeft;
      content.scrollTop = x.top ?? content.scrollTop;
    } else {
      content.scrollLeft = x;
      content.scrollTop = y;
    }
  };
  Object.defineProperty(content, 'offsetWidth', { value: 500, writable: true });
  Object.defineProperty(content, 'offsetHeight', { value: slideHeight, writable: true });
  Object.defineProperty(content, 'scrollWidth', { value: 500, writable: true });
  Object.defineProperty(content, 'scrollHeight', {
    value: slideHeight * content.children.length,
    writable: true,
  });
  Object.defineProperty(content, 'scrollLeft', { value: 0, writable: true });
  let scrollTop = 0;
  Object.defineProperty(content, 'scrollTop', {
    get() {
      return scrollTop;
    },
    set(v) {
      scrollTop = v;
    },
    configurable: true,
  });
  [...content.children].forEach((slide, slideIndex) => {
    Object.defineProperty(slide, 'offsetWidth', { value: 500, writable: true });
    Object.defineProperty(slide, 'offsetHeight', { value: slideHeight, writable: true });
    Object.defineProperty(slide, 'offsetTop', {
      get() {
        return slideIndex * slideHeight;
      },
    });
  });
}

function installVerticalCarouselTestEnv() {
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  }

  vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => ({
    width: '500px',
    height: '300px',
    direction: 'ltr',
    visibility: 'visible',
    paddingInlineStart: '0px',
    paddingInlineEnd: '0px',
    paddingBlockStart: '0px',
    paddingBlockEnd: '0px',
    maxHeight: 'none',
  }));
}

describe('vertical index navigation', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    installVerticalCarouselTestEnv();
  });

  it('scrolls to offsetTop when clicking index buttons on a vertical carousel', async () => {
    const carousel = createCarousel({
      classes: 'n-carousel--vertical n-carousel--instant',
      slides: 3,
    });
    container.appendChild(carousel);

    const content = carousel.querySelector('.n-carousel__content');
    mockVerticalCarouselLayout(content, 400);
    const buttons = carousel.querySelectorAll('.n-carousel__index button');

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));

    buttons[2].click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(content.scrollTop).toBe(800);
  });

  it('does not overshoot when auto-height target slide is taller than the viewport', async () => {
    const carousel = createCarousel({
      classes: 'n-carousel--vertical n-carousel--auto-height n-carousel--instant',
      slides: 3,
    });
    carousel.setAttribute('data-duration', '0.01');
    container.appendChild(carousel);

    const content = carousel.querySelector('.n-carousel__content');
    mockVerticalCarouselLayout(content, 200);
    const buttons = carousel.querySelectorAll('.n-carousel__index button');
    const target = content.children[2];

    window.getComputedStyle.mockImplementation((el) => {
      const style = {
        width: '500px',
        height: el === target ? '600px' : '200px',
        direction: 'ltr',
        visibility: 'visible',
        paddingInlineStart: '0px',
        paddingInlineEnd: '0px',
        paddingBlockStart: '0px',
        paddingBlockEnd: '0px',
        maxHeight: 'none',
      };
      return style;
    });

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));

    buttons[2].click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(content.scrollTop).toBe(400);
    expect(content.children[2].hasAttribute('aria-current')).toBe(true);
  });
});
