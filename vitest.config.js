import { defineConfig } from 'vitest/config';

// Standalone Vitest config so the test run doesn't load the PWA/React build
// plugins from vite.config.js — the units under test are pure ES modules.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
