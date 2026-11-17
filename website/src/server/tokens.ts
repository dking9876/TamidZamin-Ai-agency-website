import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { LeadConfig } from './config.js';

export const MIN_FORM_AGE_MS = 2000;
export const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
export type FormClaims = { id: string; iat: number; sid: string };

export function digest(secret: string, purpose: string, value: string): string {
  return createHmac('sha256', secret).update(`${purpose}\0${value}`).digest('base64url');
}

function equal(a: string, b: string): boolean {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function cookieName(config: LeadConfig): string {
  return config.secureCookie ? '__Host-tz_form' : 'tz_form';
}

export function readSession(request: Request, config: LeadConfig): string | undefined {
  const cookie = request.headers.get('cookie') ?? '';
  if (cookie.length > 8192) return undefined;
  const values = cookie.split(';').map((part) => part.trim())
    .filter((part) => part.startsWith(`${cookieName(config)}=`))
    .map((part) => part.slice(cookieName(config).length + 1));
  return values.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(values[0]!) ? values[0] : undefined;
}

export function issueFormToken(
  request: Request,
  config: LeadConfig,
  now = Date.now(),
): { token: string; cookie?: string } {
  const previous = readSession(request, config);
  const session = previous ?? randomBytes(32).toString('base64url');
  const claims: FormClaims = { id: randomUUID(), iat: now, sid: digest(config.secret, 'session', session) };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const token = `v1.${payload}.${digest(config.secret, 'token', `v1.${payload}`)}`;
  return {
    token,
    ...(!previous && {
      cookie: `${cookieName(config)}=${session}; Path=/; HttpOnly; SameSite=Strict${config.secureCookie ? '; Secure' : ''}`,
    }),
  };
}

export function verifyFormToken(
  token: string,
  request: Request,
  config: LeadConfig,
  now = Date.now(),
): { ok: true; claims: FormClaims } | { ok: false; reason: 'invalid' | 'expired' | 'early' } {
  const invalid = { ok: false, reason: 'invalid' } as const;
  const session = readSession(request, config);
  if (!session || token.length > 512) return invalid;
  const match = /^(v1)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match || !equal(match[3]!, digest(config.secret, 'token', `v1.${match[2]}`))) return invalid;
  try {
    const claims = JSON.parse(Buffer.from(match[2]!, 'base64url').toString('utf8')) as FormClaims;
    if (!claims || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(claims.id) ||
        !Number.isSafeInteger(claims.iat) || claims.iat < 0 || typeof claims.sid !== 'string' ||
        !equal(claims.sid, digest(config.secret, 'session', session)) || now < claims.iat) return invalid;
    if (now - claims.iat >= TOKEN_LIFETIME_MS) return { ok: false, reason: 'expired' };
    if (now - claims.iat < MIN_FORM_AGE_MS) return { ok: false, reason: 'early' };
    return { ok: true, claims };
  } catch {
    return invalid;
  }
}
