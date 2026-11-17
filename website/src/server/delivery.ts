import type { LeadConfig } from './config.js';
import type { Lead } from './validation.js';

export type DeliveryResult =
  | { state: 'accepted'; code: 'receiver_accepted' }
  | { state: 'rejected'; code: 'receiver_rejected' }
  | { state: 'unknown'; code: 'delivery_unconfirmed' | 'delivery_transport_error' };

export async function deliverLead(
  lead: Lead,
  requestId: string,
  config: LeadConfig,
  fetcher: typeof fetch = fetch,
): Promise<DeliveryResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.deliveryTimeoutMs);
  timer.unref();
  try {
    const response = await fetcher(config.webhookUrl, {
      method: 'POST',
      redirect: 'error',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${config.webhookToken}`,
        'Idempotency-Key': requestId,
      },
      body: JSON.stringify({
        version: 1,
        requestId,
        submittedAt: new Date().toISOString(),
        source: 'tamidzamin-contact',
        consentVersion: 'contact-request-v1',
        lead,
      }),
    });
    if (!response.body ||
        !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
      void response.body?.cancel().catch(() => {});
      return { state: 'unknown', code: 'delivery_unconfirmed' };
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) {
          void reader.cancel().catch(() => {});
          return { state: 'unknown', code: 'delivery_unconfirmed' };
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let confirmation: unknown;
    try {
      confirmation = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    } catch {
      return { state: 'unknown', code: 'delivery_unconfirmed' };
    }
    if (confirmation && typeof confirmation === 'object' && 'accepted' in confirmation) {
      if (response.ok && confirmation.accepted === true) return { state: 'accepted', code: 'receiver_accepted' };
      if (confirmation.accepted === false) return { state: 'rejected', code: 'receiver_rejected' };
    }
    return { state: 'unknown', code: 'delivery_unconfirmed' };
  } catch {
    return { state: 'unknown', code: 'delivery_transport_error' };
  } finally {
    clearTimeout(timer);
  }
}
