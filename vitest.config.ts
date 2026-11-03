import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $app: path.resolve('src/__mocks__/app'),
      '$env/dynamic/private': path.resolve('src/__mocks__/env/dynamic/private'),
    },
  },
  test: {
    environment: 'jsdom',
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['src/**/*.test.ts'], exclude: ['src/lib/components/**'] },
      },
      {
        // Component tests mount Svelte in jsdom, so they need the client build of svelte
        extends: true,
        resolve: { conditions: ['browser'] },
        test: { name: 'components', include: ['src/lib/components/**/*.test.ts'] },
      },
    ],
  },
});
