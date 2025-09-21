import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';
import preact from '@astrojs/preact';
import solid from '@astrojs/solid-js';


export default defineConfig({
integrations: [vue(), svelte(), preact(), solid()],
vite: {
ssr: { external: [] },
},
});