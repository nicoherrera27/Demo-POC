import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  integrations: [
    preact({ compat: true }),
    svelte(),
    vue(),
    tailwind()
  ],
  output: 'static',
  vite: {
    plugins: [visualizer({
        emitFile: true,
        filename: "stats.html",
    })]
  },
  devToolbar: {
    enabled: true
  },
  
});