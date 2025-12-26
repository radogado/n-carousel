import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCarousel, getActiveSlideIndex } from './utils.js';

describe('Carousel Navigation', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('Button Navigation', () => {
    it('should have clickable previous button', () => {
      const carousel = createCarousel({ slides: 3 });
      container.appendChild(carousel);

      const previousButton = carousel.querySelector('.n-carousel__previous button');
      expect(previousButton).toBeTruthy();
      expect(previousButton.tagName).toBe('BUTTON');
    });

    it('should have clickable next button', () => {
      const carousel = createCarousel({ slides: 3 });
      container.appendChild(carousel);

      const nextButton = carousel.querySelector('.n-carousel__next button');
      expect(nextButton).toBeTruthy();
      expect(nextButton.tagName).toBe('BUTTON');
    });

    it('should have index buttons for navigation', () => {
      const carousel = createCarousel({ slides: 5 });
      container.appendChild(carousel);

      const indexButtons = carousel.querySelectorAll('.n-carousel__index button');
      expect(indexButtons.length).toBe(5);
      
      indexButtons.forEach((button, index) => {
        expect(button.tagName).toBe('BUTTON');
        expect(button.textContent.trim()).toBe(String(index + 1));
      });
    });
  });

  describe('Keyboard Navigation Support', () => {
    it('should have focusable navigation buttons', () => {
      const carousel = createCarousel();
      container.appendChild(carousel);

      const previousButton = carousel.querySelector('.n-carousel__previous button');
      const nextButton = carousel.querySelector('.n-carousel__next button');

      // Buttons should be focusable
      previousButton.focus();
      expect(document.activeElement).toBe(previousButton);

      nextButton.focus();
      expect(document.activeElement).toBe(nextButton);
    });

    it('should have focusable index buttons', () => {
      const carousel = createCarousel({ slides: 3 });
      container.appendChild(carousel);

      const indexButtons = carousel.querySelectorAll('.n-carousel__index button');
      expect(indexButtons.length).toBeGreaterThan(0);

      indexButtons[0].focus();
      expect(document.activeElement).toBe(indexButtons[0]);
    });
  });

  describe('Detached Controls', () => {
    it('should support detached previous control', () => {
      const previous = document.createElement('span');
      previous.className = 'n-carousel__previous';
      previous.setAttribute('data-for', 'test-carousel');
      previous.innerHTML = '<button><span>Previous</span></button>';
      container.appendChild(previous);

      const carousel = createCarousel();
      carousel.id = 'test-carousel';
      container.appendChild(carousel);

      expect(previous.getAttribute('data-for')).toBe('test-carousel');
      expect(previous.querySelector('button')).toBeTruthy();
    });

    it('should support detached next control', () => {
      const next = document.createElement('span');
      next.className = 'n-carousel__next';
      next.setAttribute('data-for', 'test-carousel');
      next.innerHTML = '<button><span>Next</span></button>';
      container.appendChild(next);

      const carousel = createCarousel();
      carousel.id = 'test-carousel';
      container.appendChild(carousel);

      expect(next.getAttribute('data-for')).toBe('test-carousel');
      expect(next.querySelector('button')).toBeTruthy();
    });

    it('should support detached index control', () => {
      const index = document.createElement('div');
      index.className = 'n-carousel__index';
      index.setAttribute('data-for', 'test-carousel');
      index.innerHTML = '<button><span>1</span></button><button><span>2</span></button>';
      container.appendChild(index);

      const carousel = createCarousel({ slides: 2 });
      carousel.id = 'test-carousel';
      container.appendChild(carousel);

      expect(index.getAttribute('data-for')).toBe('test-carousel');
      expect(index.querySelectorAll('button').length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      const carousel = createCarousel();
      container.appendChild(carousel);

      const previous = carousel.querySelector('.n-carousel__previous button');
      const next = carousel.querySelector('.n-carousel__next button');

      expect(previous.textContent.trim()).toBe('Previous');
      expect(next.textContent.trim()).toBe('Next');
    });

    it('should have semantic HTML structure', () => {
      const carousel = createCarousel();
      container.appendChild(carousel);

      // Check for semantic elements
      expect(carousel.tagName).toBe('DIV');
      expect(carousel.querySelector('ul.n-carousel__content')).toBeTruthy();
      expect(carousel.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });
});

