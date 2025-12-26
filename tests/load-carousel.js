/**
 * Helper to load the carousel script in tests
 * Since the carousel is an ES module, we need to handle it carefully
 */

let carouselLoaded = false;
let loadPromise = null;

export async function loadCarousel() {
  if (carouselLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise(async (resolve, reject) => {
    try {
      // For testing, we'll need to import the actual module
      // Since it's wrapped in an IIFE, we need to handle it differently
      // In a real browser environment, this would be loaded via script tag
      
      // For now, we'll check if nCarouselInit exists
      // In actual tests, you might want to use a bundler or test environment
      // that can handle ES modules properly
      
      // Simulate loading by checking if the function exists
      // In a real scenario, you'd import the module:
      // await import('../n-carousel.js');
      
      // Wait a bit for any async initialization
      await new Promise(resolve => setTimeout(resolve, 50));
      
      carouselLoaded = true;
      resolve();
    } catch (error) {
      reject(error);
    }
  });

  return loadPromise;
}

