import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api/er-data': {
        target: 'https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/er-data/, ''),
        secure: false,
      },
      '/api/er-list': {
        target: 'https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/er-list/, ''),
        secure: false,
      },
    },
  },
});