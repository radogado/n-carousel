# Visual Regression Tests

This directory contains Playwright visual regression tests for the n-carousel component.

## Running Visual Tests

```bash
# Run all visual tests
npm run test:visual

# Run with UI (interactive mode)
npm run test:visual:ui

# Update snapshots (when visual changes are intentional)
npm run test:visual:update
```

## Test Structure

- `carousel-visual.test.js` - Visual snapshots for different carousel configurations

## How It Works

Visual tests:
1. Start a local dev server (port 3000)
2. Load test pages with different carousel configurations
3. Take screenshots and compare them to baseline images
4. Run across multiple browsers (Chrome, Firefox, Safari) and mobile viewports

## Updating Snapshots

When you make intentional visual changes:

```bash
npm run test:visual:update
```

This will update all baseline screenshots. Review the changes carefully before committing.

## CI Integration

Visual tests are designed to run in CI environments. They will:
- Automatically retry failed tests
- Generate HTML reports
- Save traces for debugging

