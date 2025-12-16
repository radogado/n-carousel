import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/n-carousel.rollup.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    nodeResolve({
      modulesOnly: true,
      mainFields: ['module', 'main'],
      preserveEntrySignatures: 'strict'
    }),
    commonjs({
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto'
    })
  ],
  treeshake: {
    moduleSideEffects: true,
    propertyReadSideEffects: true,
    tryCatchDeoptimization: false
  }
};
