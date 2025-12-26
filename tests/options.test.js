import { describe, it, expect, beforeEach } from 'vitest';
import { createCarousel } from './utils.js';

describe('Carousel Options', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('Layout Options', () => {
    it('should support vertical layout', () => {
      const carousel = createCarousel({ classes: 'n-carousel--vertical' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--vertical')).toBe(true);
    });

    it('should support RTL layout', () => {
      const carousel = createCarousel({ classes: 'n-carousel--rtl' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--rtl')).toBe(true);
    });

    it('should support inline mode', () => {
      const carousel = createCarousel({ classes: 'n-carousel--inline' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--inline')).toBe(true);
    });

    it('should support overlay mode', () => {
      const carousel = createCarousel({ classes: 'n-carousel--overlay' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--overlay')).toBe(true);
    });

    it('should support controls-outside', () => {
      const carousel = createCarousel({ classes: 'n-carousel--controls-outside' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--controls-outside')).toBe(true);
    });
  });

  describe('Content Options', () => {
    it('should support auto-height', () => {
      const carousel = createCarousel({ classes: 'n-carousel--auto-height' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--auto-height')).toBe(true);
    });

    it('should support peeking', () => {
      const carousel = createCarousel({ classes: 'n-carousel--peek' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--peek')).toBe(true);
    });

    it('should support endless mode', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--endless',
        slides: 5, // Endless needs at least 3 slides
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--endless')).toBe(true);
      expect(carousel.querySelectorAll('.n-carousel__content > li').length).toBeGreaterThanOrEqual(3);
    });

    it('should support auto-slide', () => {
      const carousel = createCarousel({ classes: 'n-carousel--auto-slide' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--auto-slide')).toBe(true);
    });

    it('should support instant transitions', () => {
      const carousel = createCarousel({ classes: 'n-carousel--instant' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--instant')).toBe(true);
    });
  });

  describe('Display Modes', () => {
    it('should support tabs mode', () => {
      const carousel = createCarousel({ classes: 'n-carousel--tabs' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--tabs')).toBe(true);
    });

    it('should support tabs-align-end (requires tabs)', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--tabs n-carousel--tabs-align-end',
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--tabs')).toBe(true);
      expect(carousel.classList.contains('n-carousel--tabs-align-end')).toBe(true);
    });

    it('should support thumbnails', () => {
      const carousel = createCarousel({ classes: 'n-carousel--thumbnails' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--thumbnails')).toBe(true);
    });

    it('should support lightbox mode', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--lightbox',
        hasControls: true,
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--lightbox')).toBe(true);
      expect(carousel.querySelector('.n-carousel__controls')).toBeTruthy();
    });

    it('should support aspect ratio for lightbox', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--lightbox n-carousel--aspect',
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--lightbox')).toBe(true);
      expect(carousel.classList.contains('n-carousel--aspect')).toBe(true);
    });
  });

  describe('Index Positioning', () => {
    it('should support index-start', () => {
      const carousel = createCarousel({ classes: 'n-carousel--index-start' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--index-start')).toBe(true);
    });

    it('should support index-end', () => {
      const carousel = createCarousel({ classes: 'n-carousel--index-end' });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--index-end')).toBe(true);
    });

    it('should support index alignment options', () => {
      const alignments = ['start', 'center', 'end'];
      alignments.forEach(align => {
        const carousel = createCarousel({
          classes: `n-carousel--index-align-${align}`,
        });
        container.appendChild(carousel);
        expect(carousel.classList.contains(`n-carousel--index-align-${align}`)).toBe(true);
        container.removeChild(carousel);
      });
    });
  });

  describe('Option Combinations', () => {
    it('should support vertical + auto-height', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--vertical n-carousel--auto-height',
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--vertical')).toBe(true);
      expect(carousel.classList.contains('n-carousel--auto-height')).toBe(true);
    });

    it('should support lightbox + thumbnails', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--lightbox n-carousel--thumbnails',
        hasControls: true,
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--lightbox')).toBe(true);
      expect(carousel.classList.contains('n-carousel--thumbnails')).toBe(true);
    });

    it('should support inline lightbox', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--lightbox n-carousel--inline n-carousel--thumbnails',
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--lightbox')).toBe(true);
      expect(carousel.classList.contains('n-carousel--inline')).toBe(true);
      expect(carousel.classList.contains('n-carousel--thumbnails')).toBe(true);
    });

    it('should support multiple options together', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--vertical n-carousel--auto-height n-carousel--peek n-carousel--rtl',
      });
      container.appendChild(carousel);
      expect(carousel.classList.contains('n-carousel--vertical')).toBe(true);
      expect(carousel.classList.contains('n-carousel--auto-height')).toBe(true);
      expect(carousel.classList.contains('n-carousel--peek')).toBe(true);
      expect(carousel.classList.contains('n-carousel--rtl')).toBe(true);
    });
  });

  describe('Data Attributes', () => {
    it('should support data-duration', () => {
      const carousel = createCarousel();
      carousel.setAttribute('data-duration', '0.5');
      container.appendChild(carousel);
      expect(carousel.getAttribute('data-duration')).toBe('0.5');
    });

    it('should support data-interval', () => {
      const carousel = createCarousel({ classes: 'n-carousel--auto-slide' });
      carousel.setAttribute('data-interval', '5');
      container.appendChild(carousel);
      expect(carousel.getAttribute('data-interval')).toBe('5');
      expect(carousel.classList.contains('n-carousel--auto-slide')).toBe(true);
    });

    it('should support both data attributes', () => {
      const carousel = createCarousel({ classes: 'n-carousel--auto-slide' });
      carousel.setAttribute('data-duration', '0.3');
      carousel.setAttribute('data-interval', '4');
      container.appendChild(carousel);
      expect(carousel.getAttribute('data-duration')).toBe('0.3');
      expect(carousel.getAttribute('data-interval')).toBe('4');
    });
  });
});

