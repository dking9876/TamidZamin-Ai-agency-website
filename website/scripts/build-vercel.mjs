import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const [name, args] of [['@astrojs/check', []], ['astro', ['build']]]) {
  const packageDir = resolve(root, 'node_modules', name);
  const manifest = JSON.parse(await readFile(resolve(packageDir, 'package.json'), 'utf8'));
  const bin = typeof manifest.bin === 'string' ? manifest.bin : Object.values(manifest.bin)[0];
  const result = spawnSync(process.execPath, [resolve(packageDir, bin), ...args], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DEPLOY_TARGET: 'vercel', ASTRO_TELEMETRY_DISABLED: '1' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
