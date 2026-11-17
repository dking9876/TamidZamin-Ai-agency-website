import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLaunch } from '../scripts/verify-launch.mjs';
test('unconfigured preview must not pass the launch gate', () => {
  assert.ok(checkLaunch({}).length >= 10);
  assert.ok(checkLaunch({ SITE_URL: 'https://example.invalid', SITE_LAUNCHED: 'true' }).some((message: string) => message.includes('SITE_URL')));
});
