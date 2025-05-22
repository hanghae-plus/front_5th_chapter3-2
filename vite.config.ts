import path from 'path';

import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { defineConfig as defineTestConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/mocks': path.resolve(__dirname, './src/__mocks__'),
        '@/tests': path.resolve(__dirname, './src/__tests__'),
        '@/apis': path.resolve(__dirname, './src/apis'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/utils': path.resolve(__dirname, './src/utils'),
      },
    },
  }),
  defineTestConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        reportsDirectory: './.coverage',
        reporter: ['lcov', 'json', 'json-summary'],
      },
      exclude: ['e2e/**', 'integration/**', 'node_modules/**'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/mocks': path.resolve(__dirname, './src/__mocks__'),
        '@/tests': path.resolve(__dirname, './src/__tests__'),
        '@/apis': path.resolve(__dirname, './src/apis'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/utils': path.resolve(__dirname, './src/utils'),
      },
    },
  })
);
