import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLaunch } from '../scripts/verify-launch.mjs';
test('unconfigured preview must not pass the launch gate', () => {
  assert.ok(checkLaunch({}).length >= 5);
  assert.ok(checkLaunch({ SITE_URL: 'https://example.invalid', SITE_LAUNCHED: 'true' }).some((message: string) => message.includes('SITE_URL')));
});

test('direct-contact launch rejects invalid contacts and an unreviewed policy', () => {
  const approved = {
    SITE_LAUNCHED: 'true', POLICY_CONTENT_APPROVED: 'true',
    CAPABILITIES_APPROVED: 'true', ASSET_RIGHTS_CONFIRMED: 'true', LAUNCH_APPROVED: 'true',
  };
  assert.deepEqual(checkLaunch(approved), []);
  for (const [key, value] of [
    ['PUBLIC_PHONE', '0584345513'], ['PUBLIC_WHATSAPP', '+972584345513'],
    ['PUBLIC_CONTACT_EMAIL', 'not-an-email'], ['PUBLIC_LEGAL_NAME', ''],
    ['POLICY_CONTENT_APPROVED', 'false'], ['SITE_URL', 'https://deployment.vercel.app'],
  ]) {
    assert.ok(checkLaunch({ ...approved, [key]: value }).length > 0, key);
  }
  assert.ok(checkLaunch({ ...approved, POLICY_CONTENT_APPROVED: 'false', LEGAL_REVIEW_APPROVED: 'true' }).some((message: string) => message.includes('POLICY_CONTENT_APPROVED')));
});
