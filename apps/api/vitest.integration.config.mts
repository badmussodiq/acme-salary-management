import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    setupFiles: ['reflect-metadata'],
    include: ['test/integration/**/*.int-spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
