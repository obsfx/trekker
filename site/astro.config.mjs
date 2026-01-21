import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  site: 'https://obsfx.github.io',
  base: '/trekker',
  integrations: [react(), tailwind()]
});
