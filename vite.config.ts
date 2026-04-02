import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { regiondoProductsApiPlugin } from './vite/plugins/regiondoProductsApi';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), regiondoProductsApiPlugin(env)],
  };
});
