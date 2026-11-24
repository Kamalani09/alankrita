import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const target = new URL(env.VITE_API_BASE_URL || 'http://localhost:5000/api', 'http://localhost:5000').origin;
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/robots.txt': { target }, '/sitemap.xml': { target } },
    },
  };
});
