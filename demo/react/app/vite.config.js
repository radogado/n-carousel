import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// This demo intentionally reuses the source from the repo root (single source of truth).
// __dirname is demo/react/app → repo root is ../../..
const repoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    // Use ordered aliases so `n-carousel-react/styles` doesn't get eaten by `n-carousel-react`.
    alias: [
      {
        find: /^n-carousel-react\/styles$/,
        replacement: path.resolve(repoRoot, 'react/src/styles.ts'),
      },
      {
        find: /^n-carousel-react$/,
        replacement: path.resolve(repoRoot, 'react/src/index.ts'),
      },
      {
        // Resolve `import 'n-carousel/...'` to repo root files.
        find: /^n-carousel\//,
        replacement: `${repoRoot}/`,
      },
      {
        find: /^n-carousel$/,
        replacement: repoRoot,
      },
    ],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    // Build into app/dist then copy to demo/react/ (Vite disallows outDir outside root).
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/react-demo.js',
        chunkFileNames: 'assets/react-demo-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/react-demo.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});


