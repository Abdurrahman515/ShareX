import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,                
    setupFiles: './test/setupTests.js',
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})