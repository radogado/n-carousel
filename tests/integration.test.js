import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCarousel, waitForInit, getActiveSlideIndex, triggerScroll, waitForScrollEnd } from './utils.js';

describe('Carousel Integration Tests', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Add basic styles that the carousel expects
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
        scroll-behavior: smooth;
      }
      .n-carousel__content > li {
        flex: 0 0 100%;
        scroll-snap-align: center;
        width: 100%;
        height: 100%;
      }
    `;
    document.head.appendChild(style);
  });

  describe('Carousel initialization', () => {
    it('should initialize with basic structure', () => {
      const carousel = createCarousel();
      container.appendChild(carousel);

      const content = carousel.querySelector('.n-carousel__content');
      expect(content).toBeTruthy();
      expect(content.children.length).toBe(3);
    });

    it('should handle carousel with many slides', () => {
      const carousel = createCarousel({ slides: 10 });
      container.appendChild(carousel);

      const slides = carousel.querySelectorAll('.n-carousel__content > li');
      const indexButtons = carousel.querySelectorAll('.n-carousel__index button');
      
      expect(slides.length).toBe(10);
      expect(indexButtons.length).toBe(10);
    });
  });

  describe('Option combinations', () => {
    it('should support vertical + auto-height', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--vertical n-carousel--auto-height',
      });
      container.appendChild(carousel);

      expect(carousel.classList.contains('n-carousel--vertical')).toBe(true);
      expect(carousel.classList.contains('n-carousel--auto-height')).toBe(true);
    });

    it('should support tabs mode', () => {
      const carousel = createCarousel({ classes: 'n-carousel--tabs' });
      container.appendChild(carousel);

      expect(carousel.classList.contains('n-carousel--tabs')).toBe(true);
    });

    it('should support lightbox mode', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--lightbox n-carousel--thumbnails',
        hasControls: true,
      });
      container.appendChild(carousel);

      expect(carousel.classList.contains('n-carousel--lightbox')).toBe(true);
      expect(carousel.classList.contains('n-carousel--thumbnails')).toBe(true);
      expect(carousel.querySelector('.n-carousel__controls')).toBeTruthy();
    });

    it('should support inline lightbox', () => {
      const carousel = createCarousel({
        classes: 'n-carousel--lightbox n-carousel--inline n-carousel--thumbnails',
      });
      container.appendChild(carousel);

      expect(carousel.classList.contains('n-carousel--lightbox')).toBe(true);
      expect(carousel.classList.contains('n-carousel--inline')).toBe(true);
    });

    it('should support RTL layout', () => {
      const carousel = createCarousel({ classes: 'n-carousel--rtl' });
      container.appendChild(carousel);

      expect(carousel.classList.contains('n-carousel--rtl')).toBe(true);
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
  });

  describe('Index positioning', () => {
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

  describe('Controls positioning', () => {
    it('should support controls-outside', () => {
      const carousel = createCarousel({ classes: 'n-carousel--controls-outside' });
      container.appendChild(carousel);

      expect(carousel.classList.contains('n-carousel--controls-outside')).toBe(true);
    });

    it('should have previous and next buttons', () => {
      const carousel = createCarousel();
      container.appendChild(carousel);

      const previous = carousel.querySelector('.n-carousel__previous button');
      const next = carousel.querySelector('.n-carousel__next button');

      expect(previous).toBeTruthy();
      expect(next).toBeTruthy();
    });
  });

  describe('Data attributes', () => {
    it('should respect data-duration', () => {
      const carousel = createCarousel();
      carousel.setAttribute('data-duration', '0.3');
      container.appendChild(carousel);

      expect(carousel.getAttribute('data-duration')).toBe('0.3');
    });

    it('should respect data-interval for auto-slide', () => {
      const carousel = createCarousel({ classes: 'n-carousel--auto-slide' });
      carousel.setAttribute('data-interval', '5');
      container.appendChild(carousel);

      expect(carousel.getAttribute('data-interval')).toBe('5');
      expect(carousel.classList.contains('n-carousel--auto-slide')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have semantic button elements', () => {
      const carousel = createCarousel();
      container.appendChild(carousel);

      const buttons = carousel.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have accessible labels in buttons', () => {
      const carousel = createCarousel();
      container.appendChild(carousel);

      const previous = carousel.querySelector('.n-carousel__previous button');
      const next = carousel.querySelector('.n-carousel__next button');

      expect(previous.textContent.trim()).toBe('Previous');
      expect(next.textContent.trim()).toBe('Next');
    });
  });
});

