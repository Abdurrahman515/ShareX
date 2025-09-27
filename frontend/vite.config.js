import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from "vite-jsconfig-paths"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsconfigPaths()],
  server: {
    port: 3000,
    // for CORS error
    proxy: {
      "/api" : {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setupTests.js',
    css: true,
    include: ['src/**/*.{test,spec}.{js,jsx}','test/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'test/']
    },
    hookTimeout: '30000',
    testTimeout: '30000',
  }
});
