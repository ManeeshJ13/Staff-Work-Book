import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'src/main.jsx', // Replace this with your actual entry point if different
      external: ['react-router-dom'], // Make sure it is externalized properly
      output: {
        globals: {
          'react-router-dom': 'ReactRouterDOM', // For global window usage if required
        },
      },
    },
  },
});
