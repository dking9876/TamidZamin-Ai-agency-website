export const MAX_BODY_BYTES = 32 * 1024;
const FIELDS = new Set(['name', 'phone', 'email', 'business', 'service', 'message', 'consent', 'website', 'token']);
export const SERVICES = ['whatsapp', 'phone', 'both', 'not-sure'] as const;

export type Lead = {
  name: string;
  phone: string;
  email?: string;
  business: string;
  service: typeof SERVICES[number];
  message?: string;
  consent: true;
};

export class InputError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
  }
}

export async function readFormBody(request: Request): Promise<Record<string, string>> {
  if (!/^application\/x-www-form-urlencoded(?:\s*;\s*charset=(?:utf-8|"utf-8"))?\s*$/i.test(
    request.headers.get('content-type') ?? '',
  )) throw new InputError(415, 'unsupported_media');
  const contentEncoding = request.headers.get('content-encoding');
  if (contentEncoding && contentEncoding.toLowerCase() !== 'identity') throw new InputError(415, 'unsupported_encoding');
  const length = request.headers.get('content-length');
  if (length && !/^\d+$/.test(length)) throw new InputError(400, 'invalid_length');
  if (length && Number(length) > MAX_BODY_BYTES) throw new InputError(413, 'body_too_large');
  if (!request.body) throw new InputError(400, 'empty_body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new InputError(408, 'body_timeout')), 5000);
    timer.unref();
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new InputError(413, 'body_too_large');
      chunks.push(value);
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error instanceof InputError ? error : new InputError(400, 'invalid_body');
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
  try {
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    const pairs = raw.split('&');
    if (pairs.length > FIELDS.size) throw new Error('too_many_fields');
    const fields: Record<string, string> = Object.create(null);
    for (const pair of pairs) {
      const separator = pair.indexOf('=');
      if (separator < 1) throw new Error('malformed_field');
      const key = decodeURIComponent(pair.slice(0, separator).replace(/\+/g, ' '));
      const value = decodeURIComponent(pair.slice(separator + 1).replace(/\+/g, ' '));
      if (!FIELDS.has(key) || Object.hasOwn(fields, key)) throw new Error('unexpected_field');
      fields[key] = value;
    }
    return fields;
  } catch {
    throw new InputError(400, 'malformed_form');
  }
}

export function normalizePhone(raw: string): string | undefined {
  if (raw.length > 40 || !/^\+?[\d ()\-.]+$/.test(raw)) return undefined;
  let phone = raw.replace(/[ ()\-.]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  const israeli = /^0(?:[23489]\d{7}|[57]\d{8})$/;
  if (israeli.test(phone)) return `+972${phone.slice(1)}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return undefined;
  if (phone.startsWith('+972') && !israeli.test(`0${phone.slice(4)}`)) return undefined;
  return phone;
}

function validEmail(email: string): boolean {
  if (email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local = '', domain = ''] = parts;
  if (!local || local.length > 64 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) ||
      local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && labels.every((label) =>
    label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)) &&
    /^[a-z]{2,63}$/i.test(labels.at(-1)!);
}

export function validateLead(fields: Record<string, string>):
  { ok: true; lead: Lead } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const clean = (key: string) => (fields[key] ?? '').trim().normalize('NFC').replace(/\r\n?/g, '\n');
  const text = (key: string, min: number, max: number, label: string, multiline = false) => {
    const value = clean(key);
    const length = [...value].length;
    const controls = multiline ? /[\x00-\x08\x0b-\x1f\x7f\u202a-\u202e\u2066-\u2069]/ :
      /[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/;
    if (length < min || length > max || controls.test(value)) {
      errors[key] = `${label}: יש להזין ${min > 0 ? `${min}–${max}` : `עד ${max}`} תווים תקינים.`;
    }
    return value;
  };
  const name = text('name', 2, 80, 'שם');
  const business = text('business', 2, 120, 'שם העסק');
  const message = text('message', 0, 2000, 'הודעה', true);
  const phone = normalizePhone(clean('phone'));
  if (!phone) errors.phone = 'יש להזין מספר טלפון ישראלי תקין, או מספר בינלאומי עם קידומת +.';
  const email = clean('email');
  if (email && !validEmail(email)) errors.email = 'יש להזין כתובת דוא״ל תקינה, עד 254 תווים.';
  const service = clean('service');
  if (!SERVICES.includes(service as Lead['service'])) errors.service = 'יש לבחור תחום התעניינות מהרשימה.';
  if (fields.consent !== 'yes') errors.consent = 'נדרשת הסכמה לשימוש בפרטים לצורך טיפול בפנייה.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    lead: {
      name, phone: phone!, business, service: service as Lead['service'], consent: true,
      ...(email && { email }), ...(message && { message }),
    },
  };
}
