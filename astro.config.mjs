import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import solidJs from '@astrojs/solid-js';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    preact({ compat: true }),
    solidJs(),
    svelte(),
    vue(),
    tailwind()
  ],
  output: 'static',
  vite: {
    optimizeDeps: {
      include: ['solid-js']
    }
  },
  devToolbar: {
    enabled: false
  }
});