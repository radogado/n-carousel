# Testing

This directory contains tests for the n-carousel component using Vitest.

## Running Tests

### Unit Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Visual Regression Tests (Playwright)

```bash
# Run visual tests
npm run test:visual

# Run visual tests with UI
npm run test:visual:ui

# Update visual snapshots
npm run test:visual:update
```

**Note:** Visual tests require the dev server to be running. They will automatically start it on port 3000.

## Test Structure

### Unit Tests (Vitest)

- `setup.js` - Test configuration, mocks, and carousel script loading
- `utils.js` - Test utilities for creating carousel DOM structures
- `carousel.test.js` - Basic carousel structure and API tests (14 tests)
- `integration.test.js` - Integration tests for option combinations (17 tests)
- `navigation.test.js` - Navigation controls and accessibility tests (10 tests)
- `options.test.js` - Comprehensive option and combination tests (25 tests)
- `interactions.test.js` - Keyboard events, scrolling, and interactions (18 tests)

**Total: 84 unit tests** covering all major functionality.

### Visual Regression Tests (Playwright)

- `visual/carousel-visual.test.js` - Visual regression tests for carousel appearance and interactions

Visual tests run in multiple browsers (Chromium, Firefox, WebKit) and mobile viewports.

## Test Coverage

The test suite covers:
- ✅ Basic carousel structure and DOM validation
- ✅ All carousel options and modifier classes
- ✅ Option combinations (vertical + auto-height, lightbox + thumbnails, etc.)
- ✅ Navigation controls (previous, next, index buttons)
- ✅ Detached controls with `data-for` attribute
- ✅ Accessibility (semantic HTML, focusable elements, ARIA)
- ✅ Data attributes (`data-duration`, `data-interval`)
- ✅ API functionality (`window.nCarouselInit`)

## Test Environment

Tests run in a jsdom environment with:
- Mocked ResizeObserver and MutationObserver
- Mocked requestAnimationFrame
- Mocked scrollend event (for browsers without native support)
- Mock carousel initialization function (falls back to real script if available)

## Writing New Tests

When adding new tests:

1. Use the `createCarousel()` utility from `utils.js` to create test fixtures
2. Test DOM structure first, then functionality
3. Test option combinations to ensure compatibility
4. Include accessibility checks where relevant
5. Use descriptive test names that explain what is being tested

