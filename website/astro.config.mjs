import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { checkLaunch } from './scripts/verify-launch.mjs';
import { isVercel, isLaunched, siteOrigin } from './scripts/deployment.mjs';

if (existsSync('.env')) loadEnvFile('.env');
const origin = siteOrigin();
if (isLaunched()) {
  const blockers = checkLaunch(process.env);
  if (blockers.length) throw new Error(`Launch configuration is incomplete:\n${blockers.join('\n')}`);
}

export default defineConfig({
  site: origin,
  output: 'server',
  adapter: isVercel() ? vercel({ imageService: false }) : node({ mode: 'standalone' }),
  trailingSlash: 'always',
  server: { host: '127.0.0.1', port: 4321 },
  build: { inlineStylesheets: 'never' },
  vite: { build: { sourcemap: false, assetsInlineLimit: 0 } },
});
