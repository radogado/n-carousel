/**
 * Native Carousel - TypeScript definitions
 * 
 * A carousel component which uses native scroll snapping functionality
 * with enhancements and customisation.
 */

/**
 * Carousel initialization function
 * 
 * @param host - The container element to search for carousels within.
 *               Defaults to `document` if not provided.
 *               Can be a specific element to initialize carousels within that element only.
 * 
 * @example
 * ```typescript
 * // Initialize all carousels in the document
 * nCarouselInit();
 * 
 * // Initialize carousels within a specific container
 * const container = document.querySelector('.my-container');
 * nCarouselInit(container);
 * ```
 */
declare function nCarouselInit(host?: Document | Element): void;

/**
 * Global window interface extension
 */
interface Window {
  /**
   * Initialize n-carousel components
   * 
   * @param host - Optional container element. Defaults to document.
   */
  nCarouselInit: typeof nCarouselInit;
}

/**
 * Carousel element interface
 * Extends HTMLElement with carousel-specific properties
 */
interface CarouselElement extends HTMLElement {
  /**
   * Carousel content element
   */
  querySelector(selectors: '.n-carousel__content'): CarouselContentElement | null;
  
  /**
   * All carousel content elements
   */
  querySelectorAll(selectors: '.n-carousel__content'): NodeListOf<CarouselContentElement>;
  
  /**
   * Carousel dataset with carousel-specific attributes
   */
  dataset: DOMStringMap & {
    /**
     * Animation duration in seconds (e.g., "0.5")
     */
    duration?: string;
    
    /**
     * Auto-slide interval in seconds (e.g., "4")
     */
    interval?: string;
    
    /**
     * Indicates the carousel is ready
     */
    ready?: string;
    
    /**
     * Platform identifier
     */
    platform?: string;
  };
}

/**
 * Carousel content element interface
 */
interface CarouselContentElement extends HTMLElement {
  /**
   * Update function for the carousel
   */
  nCarouselUpdate?: (content: CarouselContentElement, force?: boolean) => void;
  
  /**
   * Timeout ID for auto-slide
   */
  nCarouselTimeout?: number;
  
  /**
   * Indicates the content is ready
   */
  dataset: DOMStringMap & {
    ready?: string;
    loaded?: string;
  };
}

/**
 * Carousel option classes
 * These can be added to the carousel element to enable features
 */
type CarouselOption =
  | 'n-carousel--vertical'
  | 'n-carousel--endless'
  | 'n-carousel--auto-height'
  | 'n-carousel--auto-slide'
  | 'n-carousel--peek'
  | 'n-carousel--tabs'
  | 'n-carousel--thumbnails'
  | 'n-carousel--lightbox'
  | 'n-carousel--overlay'
  | 'n-carousel--inline'
  | 'n-carousel--fullscreen'
  | 'n-carousel--controls-outside'
  | 'n-carousel--rtl';

/**
 * Export for ES module usage
 */
export { nCarouselInit };
export type { CarouselElement, CarouselContentElement, CarouselOption };

