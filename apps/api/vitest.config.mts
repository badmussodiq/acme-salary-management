import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    setupFiles: ['reflect-metadata'],
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
});
