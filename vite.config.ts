import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      mode === 'analyze' &&
        visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: '127.0.0.1',
    },
    preview: {
      port: 4173,
      strictPort: true,
      host: '127.0.0.1',
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Manual chunking strategy per AGENTS.md §3 (perf):
          // - react core shared by every route
          // - router shared by every route
          // - data (RTK + RQ) shared by every route
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-state': [
              '@reduxjs/toolkit',
              'react-redux',
              '@tanstack/react-query',
            ],
          },
        },
      },
    },
    envPrefix: env.VITE_ENV_PREFIX ?? 'VITE_',
  };
});