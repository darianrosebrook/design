/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['../../scripts/test-setup.ts'],
  },
});
