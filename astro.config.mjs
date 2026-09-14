// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server', // <-- Esto activa el modo dinámico (SSR)
  adapter: node({
    mode: 'standalone'
  })
});