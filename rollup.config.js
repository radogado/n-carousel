import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'n-carousel.js',
  output: {
    file: 'n-carousel.rollup.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      // Ensure we resolve the scrollyfills module
      modulesOnly: true,
      // Don't exclude any modules
      mainFields: ['module', 'main'],
      // Preserve the touch event handling code
      preserveEntrySignatures: 'strict'
    }),
    commonjs({
      // Ensure we don't transform the scrollyfills module
      transformMixedEsModules: true,
      // Preserve dynamic requires
      requireReturnsDefault: 'auto'
    })
  ],
  // Ensure we don't tree-shake away the touch event handling code
  treeshake: {
    moduleSideEffects: true,
    propertyReadSideEffects: true,
    tryCatchDeoptimization: false
  }
}; 