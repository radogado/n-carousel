import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    exclude: ['tests/visual/**', 'node_modules/**', 'dist/**'],
    // Suppress source map warnings
    onConsoleLog: (log, type) => {
      if (log.includes('Failed to load source map') || log.includes('source map')) {
        return false;
      }
    },
    logHeapUsage: false,
    // Improve ES module handling
    deps: {
      inline: ['scrollyfills'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'gulpfile.js',
        'demo/',
        'safari-16.2/',
        'dist/',
        'scrollyfills.module.js',
      ],
    },
  },
});

