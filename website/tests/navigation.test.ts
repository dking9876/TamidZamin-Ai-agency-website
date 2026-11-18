import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { routes, sectionLinks } from '../src/lib/navigation';

test('every public content page has exactly one entry in the shared navigation', () => {
  const pages = readdirSync(resolve(import.meta.dirname, '../src/pages'), { recursive: true })
    .filter((name): name is string => typeof name === 'string' && name.endsWith('.astro') && name !== '404.astro')
    .map((name) => {
      const path = name.replaceAll('\\', '/').replace(/\.astro$/, '');
      return path === 'index' ? '/' : `/${path.replace(/\/index$/, '')}/`;
    })
    .sort();
  const destinations = routes.map(({ href }) => href);
  assert.equal(new Set(destinations).size, destinations.length);
  assert.deepEqual(destinations.sort(), pages);
});

test('homepage shortcuts stay separate from the page registry', () => {
  assert.deepEqual(sectionLinks.map(({ href }) => href), ['/#channels', '/#process', '/#trades', '/#benefits']);
  assert.ok(routes.every(({ href }) => !href.includes('#')));
});
