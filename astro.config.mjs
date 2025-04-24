// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';

import db from '@astrojs/db';

import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [svelte(), db()],
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  })
});
