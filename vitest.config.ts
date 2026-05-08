import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      $app: path.resolve('src/__mocks__/app'),
      '$env/dynamic/private': path.resolve('src/__mocks__/env/dynamic/private'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});