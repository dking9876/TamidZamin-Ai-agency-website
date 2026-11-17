import { isIP } from 'node:net';
import { isAbsolute, resolve } from 'node:path';
import { isVercel } from '../../scripts/deployment.mjs';

export type LeadConfig = {
  siteOrigin: string;
  webhookUrl: string;
  webhookToken: string;
  secret: string;
  dataDir: string;
  secureCookie: boolean;
  trustedProxies: string[];
  deliveryTimeoutMs: number;
};

export type ConfigResult =
  | { enabled: true; config: LeadConfig }
  | { enabled: false; code: string };

export function normalizeIp(value: string): string | undefined {
  if (value.includes('%') || !isIP(value)) return undefined;
  if (isIP(value) === 4) return value;
  const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(normalized);
  if (!mapped) return normalized;
  const high = parseInt(mapped[1]!, 16);
  const low = parseInt(mapped[2]!, 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

function allowedUrl(raw: string | undefined, local: boolean): URL | undefined {
  try {
    if (!raw || raw !== raw.trim()) return undefined;
    const url = new URL(raw);
    if (url.username || url.password || url.hash) return undefined;
    if (url.protocol === 'https:') return url;
    if (local && url.protocol === 'http:' &&
        ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)) return url;
  } catch { /* Invalid configuration disables intake. */ }
  return undefined;
}

export function readLeadConfig(env: NodeJS.ProcessEnv = process.env): ConfigResult {
  if (env.LEAD_DELIVERY_ENABLED !== 'true') return { enabled: false, code: 'delivery_disabled' };
  if (isVercel(env)) return { enabled: false, code: 'persistent_storage_required' };
  const local = env.NODE_ENV === 'development' && env.LEAD_ALLOW_INSECURE_LOCALHOST === 'true';
  const site = allowedUrl(env.SITE_URL, local);
  const webhook = allowedUrl(env.LEAD_WEBHOOK_URL, local);
  if (!site || site.pathname !== '/' || site.search ||
      site.hostname === 'example.invalid' || site.hostname.endsWith('.invalid')) {
    return { enabled: false, code: 'invalid_site_url' };
  }
  if (!webhook || webhook.hostname.endsWith('.invalid')) return { enabled: false, code: 'invalid_webhook_url' };
  const secret = env.FORM_SECRET ?? '';
  const webhookToken = env.LEAD_WEBHOOK_TOKEN ?? '';
  if (secret.length < 32 || secret.length > 4096 || secret !== secret.trim() || /[\x00-\x1f\x7f]/.test(secret)) {
    return { enabled: false, code: 'invalid_form_secret' };
  }
  if (!webhookToken || webhookToken.length > 4096 || /[^\x21-\x7e]/.test(webhookToken)) {
    return { enabled: false, code: 'invalid_webhook_token' };
  }
  if (!env.DATA_DIR || !isAbsolute(env.DATA_DIR)) return { enabled: false, code: 'invalid_data_dir' };
  const timeout = env.LEAD_WEBHOOK_TIMEOUT_MS ?? '8000';
  if (!/^\d+$/.test(timeout) || Number(timeout) < 1000 || Number(timeout) > 15000) {
    return { enabled: false, code: 'invalid_webhook_timeout' };
  }
  if (env.LEAD_TRUST_PROXY && !['true', 'false'].includes(env.LEAD_TRUST_PROXY)) {
    return { enabled: false, code: 'invalid_proxy_config' };
  }
  const trustedProxies: string[] = [];
  if (env.LEAD_TRUST_PROXY === 'true') {
    const addresses = (env.LEAD_PROXY_IPS ?? '').split(',').map((part) => part.trim());
    if (addresses.length > 16 || addresses.some((ip) => !normalizeIp(ip))) {
      return { enabled: false, code: 'invalid_proxy_config' };
    }
    trustedProxies.push(...addresses.map((ip) => normalizeIp(ip)!));
  }
  return {
    enabled: true,
    config: {
      siteOrigin: site.origin,
      webhookUrl: webhook.href,
      webhookToken,
      secret,
      dataDir: resolve(env.DATA_DIR),
      secureCookie: site.protocol === 'https:',
      trustedProxies,
      deliveryTimeoutMs: Number(timeout),
    },
  };
}

export function clientIp(request: Request, peer: string, config: LeadConfig): string | undefined {
  const address = normalizeIp(peer);
  if (!address) return undefined;
  if (!config.trustedProxies.includes(address)) return address;
  const forwarded = request.headers.get('x-forwarded-for');
  if (!forwarded || forwarded.length > 1024) return undefined;
  const chain = forwarded.split(',').map((part) => normalizeIp(part.trim()));
  if (chain.length > 16 || chain.some((ip) => !ip)) return undefined;
  chain.push(address);
  while (chain.length > 1 && config.trustedProxies.includes(chain.at(-1)!)) chain.pop();
  return chain.at(-1);
}
