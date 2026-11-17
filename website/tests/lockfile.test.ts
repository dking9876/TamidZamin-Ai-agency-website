import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

type LockedPackage = { version?: string; dependencies?: Record<string, string> };
const lock: { packages: Record<string, LockedPackage> } = JSON.parse(
  readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'),
);

for (const owner of ['@bruits/satteri-wasm32-wasi', '@rolldown/binding-wasm32-wasi']) {
  test(`lockfile includes exact EMNAPI dependencies required by ${owner}`, () => {
    const parent = lock.packages[`node_modules/${owner}`];
    assert.ok(parent, `Missing locked package: ${owner}`);
    for (const dependency of ['@emnapi/core', '@emnapi/runtime']) {
      const required = parent.dependencies?.[dependency];
      assert.ok(required, `Missing dependency declaration: ${owner} -> ${dependency}`);
      const installed = lock.packages[`node_modules/${owner}/node_modules/${dependency}`]
        ?? lock.packages[`node_modules/${dependency}`];
      assert.equal(installed?.version, required, `${owner} requires ${dependency}@${required}`);
    }
  });
}
