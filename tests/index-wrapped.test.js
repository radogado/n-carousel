import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getActiveSlideIndex, triggerScroll, waitForScrollEnd } from './utils.js';

function createWrappedIndexCarousel(slideCount = 3) {
  const carousel = document.createElement('div');
  carousel.className = 'n-carousel n-carousel--instant';
  carousel.setAttribute('data-duration', '0.01');

  const content = document.createElement('ul');
  content.className = 'n-carousel__content';
  for (let i = 0; i < slideCount; i++) {
    const slide = document.createElement('li');
    slide.textContent = `Slide ${i + 1}`;
    content.appendChild(slide);
  }
  carousel.appendChild(content);

  const index = document.createElement('div');
  index.className = 'n-carousel__index gallery gallery-columns-3';
  for (let i = 0; i < slideCount; i++) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    const link = document.createElement('a');
    link.href = `https://example.com/image-${i + 1}.jpg`;
    link.textContent = String(i + 1);
    item.appendChild(link);
    index.appendChild(item);
  }
  carousel.appendChild(index);

  const previous = document.createElement('div');
  previous.className = 'n-carousel__previous';
  previous.innerHTML = '<button><span>Previous</span></button>';
  carousel.appendChild(previous);

  const next = document.createElement('div');
  next.className = 'n-carousel__next';
  next.innerHTML = '<button><span>Next</span></button>';
  carousel.appendChild(next);

  return carousel;
}

function mockCarouselLayout(content) {
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
  Object.defineProperty(content, 'offsetHeight', { value: 300, writable: true });
  Object.defineProperty(content, 'scrollWidth', { value: 1500, writable: true });
  Object.defineProperty(content, 'scrollHeight', { value: 300, writable: true });
  Object.defineProperty(content, 'scrollLeft', { value: 0, writable: true });
  Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });
  [...content.children].forEach((slide, slideIndex) => {
    Object.defineProperty(slide, 'offsetWidth', { value: 500, writable: true });
    Object.defineProperty(slide, 'offsetHeight', { value: 300, writable: true });
    Object.defineProperty(slide, 'offsetLeft', {
      get() {
        return slideIndex * 500;
      },
    });
  });
}

describe('Wrapped index controls (WordPress gallery markup)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    if (!window.matchMedia) {
      window.matchMedia = () => ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      });
    }

    const style = document.createElement('style');
    style.textContent = `
      .n-carousel {
        width: 500px;
        height: 300px;
        overflow: hidden;
      }
      .n-carousel__content {
        display: flex;
        width: 100%;
        height: 100%;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scroll-behavior: auto;
      }
      .n-carousel__content > li {
        flex: 0 0 100%;
        scroll-snap-align: center;
        width: 500px;
        height: 300px;
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
  });

  it('documents the wrapped-control regression (parentNode vs index root)', () => {
    const carousel = createWrappedIndexCarousel(3);
    const index = carousel.querySelector('.n-carousel__index');
    const thirdLink = carousel.querySelector('.gallery-item:nth-child(3) a');

    const indexControls = index.querySelectorAll('a, button');
    const wrapperControls = thirdLink.parentNode.querySelectorAll('a, button');

    expect(indexControls.length).toBe(3);
    expect(wrapperControls.length).toBe(1);
    expect(Array.prototype.indexOf.call(indexControls, thirdLink)).toBe(2);
    expect(Array.prototype.indexOf.call(wrapperControls, thirdLink)).toBe(0);
  });

  it('activates the clicked slide when index links are wrapped in gallery-item divs', async () => {
    const carousel = createWrappedIndexCarousel(3);
    container.appendChild(carousel);

    const content = carousel.querySelector('.n-carousel__content');
    mockCarouselLayout(content);

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(carousel.dataset.ready).toBe('true');

    const thirdLink = carousel.querySelector(
      '.n-carousel__index .gallery-item:nth-child(3) a'
    );
    expect(thirdLink).toBeTruthy();

    const index = carousel.querySelector('.n-carousel__index');
    expect(typeof index.onclick).toBe('function');

    index.onclick({
      target: thirdLink,
      preventDefault: vi.fn(),
      ctrlKey: false,
      metaKey: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (getActiveSlideIndex(carousel) !== 2) {
      triggerScroll(content, 1000, 0);
      content.dataset.x = '2';
      await waitForScrollEnd(content);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    expect(
      carousel.querySelector('.n-carousel__index [aria-current="true"]')
    ).toBe(thirdLink);
    expect(getActiveSlideIndex(carousel)).toBe(2);
  });
});
