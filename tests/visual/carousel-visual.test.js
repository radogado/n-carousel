import { test, expect } from '@playwright/test';

test.describe('Carousel Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Create a simple test page with carousel
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/n-carousel.min.css">
          <style>
            body { margin: 0; padding: 20px; }
            .n-carousel { width: 600px; height: 400px; margin: 20px auto; }
            .n-carousel__content > li {
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 48px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="n-carousel">
            <ul class="n-carousel__content">
              <li>Slide 1</li>
              <li>Slide 2</li>
              <li>Slide 3</li>
            </ul>
            <div class="n-carousel__previous">
              <button><span>Previous</span></button>
            </div>
            <div class="n-carousel__next">
              <button><span>Next</span></button>
            </div>
            <div class="n-carousel__index">
              <button><span>1</span></button>
              <button><span>2</span></button>
              <button><span>3</span></button>
            </div>
          </div>
          <script src="/n-carousel.min.js" type="module"></script>
        </body>
      </html>
    `);
    
    // Wait for carousel to initialize
    await page.waitForSelector('.n-carousel[data-ready="true"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500); // Additional wait for animations
  });

  test('basic carousel appearance', async ({ page }) => {
    await expect(page.locator('.n-carousel')).toHaveScreenshot('basic-carousel.png');
  });

  test('carousel with vertical option', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('.n-carousel').classList.add('n-carousel--vertical');
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.n-carousel')).toHaveScreenshot('vertical-carousel.png');
  });

  test('carousel with tabs option', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('.n-carousel').classList.add('n-carousel--tabs');
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.n-carousel')).toHaveScreenshot('tabs-carousel.png');
  });

  test('carousel with thumbnails', async ({ page }) => {
    await page.evaluate(() => {
      const carousel = document.querySelector('.n-carousel');
      carousel.classList.add('n-carousel--thumbnails');
      // Add images to index
      const index = carousel.querySelector('.n-carousel__index');
      index.innerHTML = `
        <button><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23667eea' width='100' height='100'/%3E%3C/svg%3E" alt="Thumb 1"></button>
        <button><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23764ba2' width='100' height='100'/%3E%3C/svg%3E" alt="Thumb 2"></button>
        <button><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f093fb' width='100' height='100'/%3E%3C/svg%3E" alt="Thumb 3"></button>
      `;
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.n-carousel')).toHaveScreenshot('thumbnails-carousel.png');
  });

  test('carousel with controls-outside', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('.n-carousel').classList.add('n-carousel--controls-outside');
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.n-carousel')).toHaveScreenshot('controls-outside-carousel.png');
  });

  test('carousel with peek option', async ({ page }) => {
    await page.evaluate(() => {
      const carousel = document.querySelector('.n-carousel');
      carousel.classList.add('n-carousel--peek');
      const content = carousel.querySelector('.n-carousel__content');
      content.style.setProperty('--peek', '50px');
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.n-carousel')).toHaveScreenshot('peek-carousel.png');
  });
});

test.describe('Carousel Interactions Visual', () => {
  test('carousel after clicking next button', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/n-carousel.min.css">
          <style>
            body { margin: 0; padding: 20px; }
            .n-carousel { width: 600px; height: 400px; margin: 20px auto; }
            .n-carousel__content > li {
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 48px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="n-carousel">
            <ul class="n-carousel__content">
              <li>Slide 1</li>
              <li>Slide 2</li>
              <li>Slide 3</li>
            </ul>
            <div class="n-carousel__previous">
              <button><span>Previous</span></button>
            </div>
            <div class="n-carousel__next">
              <button><span>Next</span></button>
            </div>
            <div class="n-carousel__index">
              <button><span>1</span></button>
              <button><span>2</span></button>
              <button><span>3</span></button>
            </div>
          </div>
          <script src="/n-carousel.min.js" type="module"></script>
        </body>
      </html>
    `);
    
    await page.waitForSelector('.n-carousel[data-ready="true"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Click next button
    await page.click('.n-carousel__next button');
    await page.waitForTimeout(1000); // Wait for animation
    
    await expect(page.locator('.n-carousel')).toHaveScreenshot('carousel-after-next.png');
  });
});

