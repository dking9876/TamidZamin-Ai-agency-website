import { clientIp, readLeadConfig, type LeadConfig } from './config.js';
import { deliverLead } from './delivery.js';
import { getLeadStore, type LeadStore } from './store.js';
import { digest, issueFormToken, verifyFormToken } from './tokens.js';
import { InputError, readFormBody, validateLead } from './validation.js';

export const UNAVAILABLE_MESSAGE = 'שליחת פניות דרך האתר אינה זמינה כרגע. לא נשלחה פנייה. אפשר לחזור לעמוד יצירת הקשר ולבדוק שוב בהמשך.';
const ACCEPTED_MESSAGE = 'הפנייה התקבלה במערכת הפניות. זהו אישור קבלה בלבד, ולא אישור לשיחה, לתור או למועד חזרה.';
const UNKNOWN_MESSAGE = 'לא ניתן לאשר אם הפנייה התקבלה. אין לשלוח אותה שוב כעת כדי להימנע מכפילות. שמרו את מספר הפנייה לבירור בהמשך.';
type Result = { ok: boolean; message: string; errors?: Record<string, string>; reference?: string };
type Dependencies = { env?: NodeJS.ProcessEnv; now?: () => number; store?: LeadStore; fetcher?: typeof fetch };

function logFailure(code: string, reference?: string): void {
  console.error('[lead]', code, ...(reference ? [reference] : []));
}

export function getLeadForm(request: Request): { enabled: boolean; token: string; cookie?: string; message?: string } {
  const result = readLeadConfig();
  if (!result.enabled) return { enabled: false, token: '', message: UNAVAILABLE_MESSAGE };
  try {
    getLeadStore(result.config.dataDir);
    return { enabled: true, ...issueFormToken(request, result.config) };
  } catch {
    logFailure('storage_unavailable');
    return { enabled: false, token: '', message: UNAVAILABLE_MESSAGE };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

function respond(request: Request, status: number, result: Result, additional: Record<string, string> = {}): Response {
  const headers = new Headers({
    'Cache-Control': 'no-store, private',
    Pragma: 'no-cache',
    Vary: 'Accept',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; style-src 'unsafe-inline'",
    ...additional,
  });
  if (request.headers.get('accept')?.split(',').some((part) => part.trim().split(';')[0] === 'application/json')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify(result), { status, headers });
  }
  headers.set('Content-Type', 'text/html; charset=utf-8');
  const errors = Object.values(result.errors ?? {});
  const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${result.ok ? 'אישור קבלת פנייה' : 'לא ניתן לאשר את הפנייה'} | TamidZamin</title>
<style>body{font:1.125rem/1.8 system-ui,sans-serif;color:#132c29;background:#f6f8f5;margin:0;padding:2rem 1rem}main{max-width:42rem;margin:8vh auto;padding:2rem;background:white;border:1px solid #becdc7;border-radius:1rem}h1{line-height:1.4}a{color:#075b46;text-underline-offset:.2em}a:focus-visible{outline:3px solid #075b46;outline-offset:5px}bdi{overflow-wrap:anywhere}</style>
</head><body><main><h1>${result.ok ? 'הפנייה התקבלה' : 'הפנייה לא אושרה'}</h1>
<p role="${result.ok ? 'status' : 'alert'}">${escapeHtml(result.message)}</p>
${errors.length ? `<h2>פרטים לתיקון</h2><ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>` : ''}
${result.reference ? `<p>מספר פנייה: <bdi dir="ltr">${escapeHtml(result.reference)}</bdi></p>` : ''}
<p><a href="/contact/">חזרה לעמוד יצירת הקשר</a></p>
${status === 400 ? '<p>אפשר לחזור לטופס באמצעות כפתור החזרה בדפדפן ולתקן את הפרטים.</p>' : ''}
</main></body></html>`;
  return new Response(html, { status, headers });
}

function sameOrigin(request: Request, config: LeadConfig): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  return request.headers.get('origin') === config.siteOrigin &&
    (!fetchSite || fetchSite === 'same-origin' || fetchSite === 'none');
}

export async function handleLead(request: Request, peerAddress: string | (() => string), dependencies: Dependencies = {}): Promise<Response> {
  if (request.method !== 'POST') {
    return respond(request, 405, { ok: false, message: 'יש לשלוח את הפנייה באמצעות הטופס.' }, { Allow: 'POST' });
  }
  const configuration = readLeadConfig(dependencies.env);
  if (!configuration.enabled) return respond(request, 503, { ok: false, message: UNAVAILABLE_MESSAGE });
  const config = configuration.config;
  if (!sameOrigin(request, config)) {
    return respond(request, 403, { ok: false, message: 'לא ניתן לאמת את מקור הבקשה. יש לפתוח מחדש את הטופס באתר.' });
  }
  const ip = clientIp(request, typeof peerAddress === 'function' ? peerAddress() : peerAddress, config);
  if (!ip) return respond(request, 503, { ok: false, message: UNAVAILABLE_MESSAGE });
  const now = dependencies.now ?? Date.now;
  let store: LeadStore;
  try {
    store = dependencies.store ?? getLeadStore(config.dataDir);
    const rate = store.takeRateLimit(digest(config.secret, 'ip', ip), now());
    if (!rate.allowed) {
      return respond(request, 429, { ok: false, message: 'נשלחו יותר מדי בקשות בזמן קצר. יש להמתין ולנסות שוב בהמשך.' },
        { 'Retry-After': String(rate.retryAfter) });
    }
  } catch {
    logFailure('storage_unavailable');
    return respond(request, 503, { ok: false, message: UNAVAILABLE_MESSAGE });
  }
  let fields: Record<string, string>;
  try {
    fields = await readFormBody(request);
  } catch (error) {
    const status = error instanceof InputError ? error.status : 400;
    const message = status === 413 ? 'הטופס גדול מדי. יש לקצר את ההודעה ולנסות שוב.' :
      status === 408 ? 'קריאת הטופס ארכה זמן רב מדי. לא נשלחה פנייה.' :
        'לא ניתן לקרוא את הטופס. יש לחזור לעמוד יצירת הקשר ולנסות שוב.';
    return respond(request, status, { ok: false, message });
  }
  if (fields.website) return respond(request, 400, { ok: false, message: 'לא ניתן לשלוח את הטופס הזה. לא נשלחה פנייה.' });
  const token = verifyFormToken(fields.token ?? '', request, config, now());
  if (!token.ok) {
    return respond(request, token.reason === 'early' ? 400 : 403, {
      ok: false,
      message: token.reason === 'early' ? 'יש להמתין לפחות שתי שניות לאחר פתיחת הטופס לפני שליחתו.' :
        'תוקף הטופס פג או שלא ניתן לאמת אותו. יש לפתוח מחדש את עמוד יצירת הקשר.',
    });
  }
  const validation = validateLead(fields);
  if (!validation.ok) return respond(request, 400, { ok: false, message: 'יש לתקן את הפרטים המסומנים. לא נשלחה פנייה.', errors: validation.errors });
  const reference = token.claims.id;
  try {
    const reservation = store.reserve(reference, digest(config.secret, 'lead', JSON.stringify(validation.lead)),
      now(), config.deliveryTimeoutMs + 5000);
    if (reservation.state === 'accepted') return respond(request, 200, { ok: true, message: ACCEPTED_MESSAGE, reference });
    if (reservation.state === 'pending') {
      return respond(request, 409, { ok: false, message: 'הפנייה כבר נמצאת בעיבוד. עדיין אין אישור קבלה; אין לשלוח פנייה נוספת.', reference },
        { 'Retry-After': '3' });
    }
    if (reservation.state === 'unknown') return respond(request, 503, { ok: false, message: UNKNOWN_MESSAGE, reference });
    if (reservation.state === 'rejected') {
      return respond(request, 502, { ok: false, message: 'מערכת הפניות לא קיבלה את הפנייה. לא נעשה ניסיון שליחה נוסף.', reference });
    }
    if (reservation.state === 'conflict') {
      return respond(request, 409, { ok: false, message: 'הטופס כבר שימש לפנייה עם פרטים אחרים. אין לשלוח אותו שוב.', reference });
    }
    if (reservation.state === 'full') return respond(request, 503, { ok: false, message: UNAVAILABLE_MESSAGE });
  } catch {
    logFailure('receipt_unavailable', reference);
    return respond(request, 503, { ok: false, message: UNAVAILABLE_MESSAGE });
  }
  const delivery = await deliverLead(validation.lead, reference, config, dependencies.fetcher);
  try {
    store.complete(reference, delivery.state, now());
  } catch {
    logFailure('receipt_confirmation_failed', reference);
    return respond(request, 503, { ok: false, message: UNKNOWN_MESSAGE, reference });
  }
  if (delivery.state === 'accepted') return respond(request, 201, { ok: true, message: ACCEPTED_MESSAGE, reference });
  logFailure(delivery.code, reference);
  return respond(request, 502, {
    ok: false, reference,
    message: delivery.state === 'rejected' ? 'מערכת הפניות לא קיבלה את הפנייה. לא התקבל אישור קבלה.' : UNKNOWN_MESSAGE,
  });
}
