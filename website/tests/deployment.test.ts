import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isVercel, siteOrigin } from '../scripts/deployment.mjs';
import { checkLaunch } from '../scripts/verify-launch.mjs';
import { readLeadConfig } from '../src/server/config.js';
import { handleLead } from '../src/server/leads.js';

test('deployment adapter selection requires an explicit Vercel target', () => {
  assert.equal(isVercel({}), false);
  assert.equal(isVercel({ VERCEL: '0' }), false);
  assert.equal(isVercel({ VERCEL: '1' }), true);
  assert.equal(isVercel({ DEPLOY_TARGET: 'vercel' }), true);
});

test('canonical origin uses the approved domain before the Vercel preview URL', () => {
  assert.equal(siteOrigin({}), 'http://localhost:4321');
  assert.equal(siteOrigin({ VERCEL: '1', VERCEL_URL: 'preview.vercel.app' }), 'https://preview.vercel.app');
  assert.equal(siteOrigin({ DEPLOY_TARGET: 'vercel', VERCEL_URL: 'preview.vercel.app' }), 'https://preview.vercel.app');
  assert.equal(siteOrigin({
    SITE_URL: 'https://approved.test/', VERCEL: '1', VERCEL_URL: 'preview.vercel.app',
  }), 'https://approved.test');
});

test('Vercel lead delivery fails closed before touching storage or the receiver', async () => {
  for (const target of [{ VERCEL: '1' }, { DEPLOY_TARGET: 'vercel' }]) {
    const env = { ...target, LEAD_DELIVERY_ENABLED: 'true' };
    assert.deepEqual(readLeadConfig(env), { enabled: false, code: 'persistent_storage_required' });
    const response = await handleLead(new Request('https://preview.test/api/lead/', {
      method: 'POST', headers: { Accept: 'application/json' }, body: 'name=test',
    }), () => { throw new Error('Disabled intake must not request adapter clientAddress'); }, {
      env,
      fetcher: async () => { throw new Error('Vercel preview must not contact a receiver'); },
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  }
});

test('Vercel cannot pass launch gates by only setting approval flags', () => {
  const env = {
    VERCEL: '1', SITE_URL: 'https://approved.test', SITE_LAUNCHED: 'true',
    PUBLIC_LEGAL_NAME: 'Test fixture', PUBLIC_CONTACT_EMAIL: 'owner@approved.test',
    LEGAL_REVIEW_APPROVED: 'true', CAPABILITIES_APPROVED: 'true',
    ASSET_RIGHTS_CONFIRMED: 'true', LAUNCH_APPROVED: 'true',
  };
  assert.deepEqual(checkLaunch(env, { requireDelivery: false }), [
    'Vercel is preview-only until lead protection/idempotency storage is migrated from local SQLite to durable storage.',
  ]);
});
