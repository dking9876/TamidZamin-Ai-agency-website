import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isVercel, siteOrigin, isLaunched, publicContact } from '../scripts/deployment.mjs';
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
  assert.equal(siteOrigin({}), 'https://www.tamidzamin.com');
  assert.equal(siteOrigin({ VERCEL: '1', VERCEL_URL: 'preview.vercel.app' }), 'https://www.tamidzamin.com');
  assert.equal(siteOrigin({ DEPLOY_TARGET: 'vercel', VERCEL_URL: 'preview.vercel.app' }), 'https://www.tamidzamin.com');
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

test('direct-contact Vercel production can launch without activating form delivery', () => {
  const env = {
    VERCEL: '1', VERCEL_ENV: 'production', SITE_URL: 'https://approved.test', SITE_LAUNCHED: 'true',
    PUBLIC_LEGAL_NAME: 'Test fixture', PUBLIC_CONTACT_EMAIL: 'owner@approved.test',
    POLICY_CONTENT_APPROVED: 'true', CAPABILITIES_APPROVED: 'true',
    ASSET_RIGHTS_CONFIRMED: 'true', LAUNCH_APPROVED: 'true',
  };
  assert.deepEqual(checkLaunch(env), []);
  assert.ok(checkLaunch({ ...env, LEAD_DELIVERY_ENABLED: 'true' }).some((message: string) => message.includes('must remain disabled')));
  assert.ok(checkLaunch({ ...env, VERCEL_ENV: 'preview' }).some((message: string) => message.includes('previews stay noindex')));
});

test('a copied launch flag never makes a Vercel preview indexable', () => {
  assert.equal(isLaunched({}), false);
  assert.equal(isLaunched({ SITE_LAUNCHED: 'true' }), true);
  assert.equal(isLaunched({ SITE_LAUNCHED: 'false', VERCEL: '1', VERCEL_ENV: 'production' }), false);
  for (const VERCEL_ENV of [undefined, 'preview', 'development']) {
    assert.equal(isLaunched({ SITE_LAUNCHED: 'true', VERCEL: '1', VERCEL_ENV }), false);
  }
  assert.equal(isLaunched({ SITE_LAUNCHED: 'true', VERCEL: '1', VERCEL_ENV: 'production' }), true);
});

test('approved contact URLs have the exact number and owner-supplied message', () => {
  const contact = publicContact({});
  const url = new URL(contact.whatsappUrl);
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/972584345513');
  assert.equal(url.searchParams.get('text'), 'היי, אני מתעניין בסוכן לעסק שלי. אשמח לשמוע פרטים');
  assert.equal(contact.phoneUrl, 'tel:+972584345513');
  assert.equal(contact.phoneDisplay, '058-4345513');
  assert.equal(contact.legalName, 'דניאל וייצר');
  assert.equal(contact.email, 'tamidzaminai@gmail.com');
});
