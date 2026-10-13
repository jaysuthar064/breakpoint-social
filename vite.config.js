import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const wordpressOrigin = 'http://localhost:8887';

/**
 * The public site.
 *
 * The dev server proxies the API so local work is same-origin. In production
 * the frontend is a different origin, which the plugin allows: its public read
 * routes send `Access-Control-Allow-Origin: *`.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/wp-api': {
        target: wordpressOrigin,
        changeOrigin: true,
        rewrite(path) {
          const [pathname, ...queryParts] = path.split('?');
          const route = pathname.replace(/^\/wp-api/, '') || '/';
          const query = queryParts.length ? `&${queryParts.join('?')}` : '';

          return `/index.php?rest_route=${encodeURIComponent(route)}${query}`;
        },
      },
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
