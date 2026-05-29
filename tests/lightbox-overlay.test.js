import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockCarouselLayout } from './utils.js';

function createLightboxCarousel(slideCount = 3) {
  const carousel = document.createElement('div');
  carousel.className =
    'n-carousel n-carousel--lightbox n-carousel--inline n-carousel--instant';
  carousel.setAttribute('data-duration', '0.01');

  const content = document.createElement('ul');
  content.className = 'n-carousel__content';
  for (let i = 0; i < slideCount; i++) {
    const slide = document.createElement('li');
    slide.innerHTML = `<figure><img src="https://example.com/img-${i + 1}.jpg" alt="Slide ${i + 1}"></figure>`;
    content.appendChild(slide);
  }
  carousel.appendChild(content);

  const index = document.createElement('div');
  index.className = 'n-carousel__index';
  for (let i = 0; i < slideCount; i++) {
    const link = document.createElement('a');
    link.href = `https://example.com/img-${i + 1}.jpg`;
    link.textContent = String(i + 1);
    index.appendChild(link);
  }
  carousel.appendChild(index);

  const controls = document.createElement('div');
  controls.className = 'n-carousel__controls';
  controls.innerHTML = `
    <div class="n-carousel__full-screen"><button type="button"><span>Toggle full screen</span></button></div>
    <div class="n-carousel__close"><button type="button"><span>Close modal window</span></button></div>
  `;
  carousel.appendChild(controls);

  const previous = document.createElement('div');
  previous.className = 'n-carousel__previous';
  previous.innerHTML = '<button type="button"><span>Previous</span></button>';
  carousel.appendChild(previous);

  const next = document.createElement('div');
  next.className = 'n-carousel__next';
  next.innerHTML = '<button type="button"><span>Next</span></button>';
  carousel.appendChild(next);

  return carousel;
}

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

describe('Lightbox overlay and image priority', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    installCarouselTestEnv();
  });

  it('prioritizes the first lightbox slide image when slides are visible', async () => {
    const carousel = createLightboxCarousel(3);
    carousel.classList.remove('n-carousel--inline');
    container.appendChild(carousel);
    mockCarouselLayout(carousel.querySelector('.n-carousel__content'));

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const imgs = carousel.querySelectorAll('.n-carousel__content > li img');
    expect(imgs[0].getAttribute('fetchpriority')).toBe('high');
    expect(imgs[0].hasAttribute('loading')).toBe(false);
    expect(imgs[1].getAttribute('fetchpriority')).toBe('low');
    expect(imgs[1].getAttribute('loading')).toBe('lazy');
    expect(imgs[2].getAttribute('fetchpriority')).toBe('low');
  });

  it('opens and closes overlay via the close toggle button', async () => {
    const carousel = createLightboxCarousel(2);
    container.appendChild(carousel);
    mockCarouselLayout(carousel.querySelector('.n-carousel__content'));

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const closeBtn = carousel.querySelector('.n-carousel__close button');
    expect(carousel.classList.contains('n-carousel--overlay')).toBe(false);

    closeBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(carousel.classList.contains('n-carousel--overlay')).toBe(true);

    closeBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(carousel.classList.contains('n-carousel--overlay')).toBe(false);
  });

  it('closes overlay on Escape keyup', async () => {
    const carousel = createLightboxCarousel(2);
    container.appendChild(carousel);
    mockCarouselLayout(carousel.querySelector('.n-carousel__content'));

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));

    carousel.querySelector('.n-carousel__close button').click();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(carousel.classList.contains('n-carousel--overlay')).toBe(true);

    document.body.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'Escape', bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(carousel.classList.contains('n-carousel--overlay')).toBe(false);
  });

  it('traps focus inside overlay when open', async () => {
    const carousel = createLightboxCarousel(2);
    container.appendChild(carousel);
    mockCarouselLayout(carousel.querySelector('.n-carousel__content'));

    window.nCarouselInit(document);
    await new Promise((resolve) => setTimeout(resolve, 300));

    carousel.querySelector('.n-carousel__close button').click();
    await new Promise((resolve) => setTimeout(resolve, 150));

    const focusable = carousel.querySelector(
      '.n-carousel__close button, .n-carousel__full-screen button, .n-carousel__previous button, .n-carousel__next button, .n-carousel__index a'
    );
    expect(focusable).toBeTruthy();
    focusable.focus();
    expect(document.activeElement).toBe(focusable);
  });
});
