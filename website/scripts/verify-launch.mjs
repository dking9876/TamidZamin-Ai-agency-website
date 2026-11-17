import { pathToFileURL } from 'node:url';
import { isVercel } from './deployment.mjs';
export function checkLaunch(env, { requireDelivery = true } = {}) {
  const blockers = [];
  if (isVercel(env)) blockers.push('Vercel is preview-only until lead protection/idempotency storage is migrated from local SQLite to durable storage.');
  const url = env.SITE_URL;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password || /localhost|\.invalid$|\.example$|example\.com$|127\.0\.0\.1/.test(parsed.hostname)) throw new Error();
  } catch { blockers.push('SITE_URL must be the approved public HTTPS origin, not a placeholder.'); }
  if (env.SITE_LAUNCHED !== 'true') blockers.push('SITE_LAUNCHED is not true: preview stays noindex.');
  if (!env.PUBLIC_LEGAL_NAME?.trim()) blockers.push('PUBLIC_LEGAL_NAME is missing.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.PUBLIC_CONTACT_EMAIL || '')) blockers.push('A valid PUBLIC_CONTACT_EMAIL is needed, including for accessibility and privacy.');
  if (requireDelivery) {
    if (env.LEAD_DELIVERY_ENABLED !== 'true') blockers.push('Lead delivery is disabled.');
    for (const key of ['LEAD_WEBHOOK_URL', 'LEAD_WEBHOOK_TOKEN', 'FORM_SECRET', 'DATA_DIR']) if (!env[key]) blockers.push(`${key} is missing.`);
  }
  for (const key of ['LEGAL_REVIEW_APPROVED', 'CAPABILITIES_APPROVED', 'ASSET_RIGHTS_CONFIRMED', 'LAUNCH_APPROVED']) if (env[key] !== 'true') blockers.push(`${key} must be explicitly confirmed.`);
  return blockers;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const blockers = checkLaunch(process.env);
  if (blockers.length) { console.error(`NOT READY TO LAUNCH\n${blockers.map((s) => `- ${s}`).join('\n')}`); process.exitCode = 1; }
  else console.log('Configuration gates pass. Still verify TLS, receiver delivery, restore procedure and human accessibility before publication.');
}
