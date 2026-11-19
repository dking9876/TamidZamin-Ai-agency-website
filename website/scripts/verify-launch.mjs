import { pathToFileURL } from 'node:url';
import business from '../src/data/business.json' with { type: 'json' };
import { isVercel, publicContact } from './deployment.mjs';
export function checkLaunch(env) {
  const blockers = [];
  const contact = publicContact(env);
  const url = env.SITE_URL ?? business.origin;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password || /localhost|\.invalid$|\.example$|example\.com$|\.vercel\.app$|127\.0\.0\.1/.test(parsed.hostname)) throw new Error();
  } catch { blockers.push('SITE_URL must be the approved public HTTPS origin, not a placeholder.'); }
  if (env.SITE_LAUNCHED !== 'true') blockers.push('SITE_LAUNCHED is not true: preview stays noindex.');
  if (isVercel(env) && env.VERCEL_ENV !== 'production') {
    blockers.push('Only the Vercel production environment may be indexed; previews stay noindex.');
  }
  if (!contact.legalName.trim()) blockers.push('PUBLIC_LEGAL_NAME must identify the responsible operator.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) blockers.push('A valid PUBLIC_CONTACT_EMAIL is needed, including for accessibility and privacy.');
  if (!/^\+[1-9]\d{7,14}$/.test(contact.phone)) blockers.push('PUBLIC_PHONE must use international +country-code format.');
  if (!/^[1-9]\d{7,14}$/.test(contact.whatsapp)) blockers.push('PUBLIC_WHATSAPP must contain international digits only.');
  if (env.LEAD_DELIVERY_ENABLED === 'true') blockers.push('This is a direct-contact launch. LEAD_DELIVERY_ENABLED must remain disabled.');
  for (const key of ['POLICY_CONTENT_APPROVED', 'CAPABILITIES_APPROVED', 'ASSET_RIGHTS_CONFIRMED', 'LAUNCH_APPROVED']) if (env[key] !== 'true') blockers.push(`${key} must be explicitly confirmed.`);
  return blockers;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const blockers = checkLaunch(process.env);
  if (blockers.length) { console.error(`NOT READY TO LAUNCH\n${blockers.map((s) => `- ${s}`).join('\n')}`); process.exitCode = 1; }
  else console.log('Direct-contact configuration gates pass. Verify the deployed domain, WhatsApp/phone destinations, crawler controls and accessibility. Owner policy approval is not legal certification.');
}
