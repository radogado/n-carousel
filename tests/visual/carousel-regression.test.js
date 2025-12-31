import { test, expect } from '@playwright/test';

function testPageHtml(extraCarouselClasses = '') {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <link rel="stylesheet" href="/n-carousel.min.css">
      <style>
        body { margin: 0; padding: 20px; }
        .n-carousel { width: 640px; height: 360px; margin: 20px auto; }
        .n-carousel__content > li {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          background: #223;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="n-carousel ${extraCarouselClasses}" data-duration="0.001">
        <ul class="n-carousel__content">
          <li id="s1">Slide 1</li>
          <li id="s2">Slide 2</li>
          <li id="s3">Slide 3</li>
          <li id="s4">Slide 4</li>
        </ul>
        <div class="n-carousel__previous"><button><span>Previous</span></button></div>
        <div class="n-carousel__next"><button><span>Next</span></button></div>
        <div class="n-carousel__index">
          <button><span>1</span></button>
          <button><span>2</span></button>
          <button><span>3</span></button>
          <button><span>4</span></button>
        </div>
        <div class="n-carousel__full-screen"><button><span>Full screen</span></button></div>
        <div class="n-carousel__close"><button><span>Overlay</span></button></div>
      </div>
      <script type="module" src="/n-carousel.min.js"></script>
    </body>
  </html>`;
}

async function installFullscreenStub(page) {
  await page.addInitScript(() => {
    // Deterministic fullscreen stub for headless tests.
    // We keep a single active fullscreen element and dispatch fullscreenchange on that element.
    (window).__fsEl = null;

    const defineFsProp = (name) => {
      try {
        Object.defineProperty(document, name, {
          configurable: true,
          get() {
            return (window).__fsEl;
          },
        });
      } catch (e) {
        // ignore
      }
    };
    defineFsProp('fullscreenElement');
    defineFsProp('webkitFullscreenElement');

    const dispatchFsChange = (el) => {
      if (!el) return;
      el.dispatchEvent(new Event('fullscreenchange', { bubbles: true }));
      el.dispatchEvent(new Event('webkitfullscreenchange', { bubbles: true }));
    };

    document.exitFullscreen = async () => {
      const prev = (window).__fsEl;
      (window).__fsEl = null;
      dispatchFsChange(prev);
    };
    document.webkitExitFullscreen = document.exitFullscreen;

    HTMLElement.prototype.requestFullscreen = async function () {
      (window).__fsEl = this;
      dispatchFsChange(this);
    };
    HTMLElement.prototype.webkitRequestFullscreen = HTMLElement.prototype.requestFullscreen;
  });
}

async function activeSlideText(page) {
  return await page.evaluate(() => {
    const active = document.querySelector('.n-carousel__content > [aria-current="true"], .n-carousel__content > [aria-current]');
    return active ? active.textContent.trim() : null;
  });
}

async function initCarousel(page) {
  // Ensure the module loaded and then force init (setContent doesn't guarantee DOMContentLoaded timing).
  await page.waitForFunction(() => typeof window.nCarouselInit === 'function');
  await page.evaluate(() => window.nCarouselInit());
  await page.waitForFunction(() => document.querySelector('.n-carousel')?.dataset.ready === 'true');
}

test.describe('Carousel Regression (complex seams)', () => {
  test.beforeEach(async ({ page }) => {
    await installFullscreenStub(page);
    // Ensure the document has the same origin as the dev server so module scripts can load.
    await page.goto('/');
  });

  test('fullscreen exit restores current slide (non-endless)', async ({ page }) => {
    await page.setContent(testPageHtml(''));
    await initCarousel(page);

    // Go to slide 2.
    await page.click('.n-carousel__index button:nth-child(2)');
    await expect.poll(() => activeSlideText(page)).toBe('Slide 2');

    // Enter fullscreen.
    await page.click('.n-carousel__full-screen button');
    await page.waitForTimeout(50);

    // Navigate while fullscreen: go to slide 4.
    await page.click('.n-carousel__next button');
    await page.click('.n-carousel__next button');
    await expect.poll(() => activeSlideText(page)).toBe('Slide 4');

    // Exit fullscreen natively (as if Escape).
    await page.evaluate(() => document.exitFullscreen());

    // Must remain on the slide we ended on while fullscreen.
    await expect.poll(() => activeSlideText(page)).toBe('Slide 4');
  });

  test('endless: index click navigates to correct logical slide after shuffles', async ({ page }) => {
    await page.setContent(testPageHtml('n-carousel--endless'));
    await initCarousel(page);

    // Shuffle DOM by moving forward a few times.
    await page.click('.n-carousel__next button');
    await page.click('.n-carousel__next button');
    await page.click('.n-carousel__next button');
    await page.waitForTimeout(50);

    // Click index "1" and ensure we land on "Slide 1".
    await page.click('.n-carousel__index button:nth-child(1)');
    await expect.poll(() => activeSlideText(page)).toBe('Slide 1');
  });

  test('overlay fullscreen stays interactive (no stuck data-sliding)', async ({ page }) => {
    await page.setContent(testPageHtml(''));
    await initCarousel(page);

    // Open overlay.
    await page.click('.n-carousel__close button');
    await expect(page.locator('.n-carousel')).toHaveClass(/n-carousel--overlay/);

    // Simulate an accidental sliding lock (this is the root of "unclickable" bugs).
    await page.evaluate(() => {
      document.querySelector('.n-carousel').dataset.sliding = 'true';
    });

    // Simulate entering fullscreen and ensure fullscreenchange clears the lock.
    await page.evaluate(() => {
      const wrapper = document.querySelector('.n-carousel');
      // Our fullscreen stub reads window.__fsEl via document.fullscreenElement getter.
      window.__fsEl = wrapper;
      wrapper.dispatchEvent(new Event('fullscreenchange', { bubbles: true }));
    });

    await expect.poll(async () => {
      return await page.evaluate(() => document.querySelector('.n-carousel').hasAttribute('data-sliding'));
    }).toBe(false);
  });
});


