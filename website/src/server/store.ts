import { chmodSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const RATE_WINDOW_MS = 15 * 60 * 1000;
export const IP_RATE_LIMIT = 12;
export const GLOBAL_RATE_LIMIT = 200;
export const RECEIPT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_RECEIPTS = 10_000;
export type ReceiptState = 'pending' | 'accepted' | 'rejected' | 'unknown';
type Receipt = { fingerprint: string; state: ReceiptState; updated: number };
export type Reservation = { state: ReceiptState | 'new' | 'conflict' | 'full' };

export class LeadStore {
  private readonly db: DatabaseSync;

  constructor(directory: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const path = join(directory, 'leads.sqlite');
    this.db = new DatabaseSync(path);
    try {
      chmodSync(path, 0o600);
      this.db.exec(`
        PRAGMA busy_timeout = 5000;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = FULL;
        CREATE TABLE IF NOT EXISTS rate_buckets (
          key TEXT NOT NULL, window INTEGER NOT NULL, count INTEGER NOT NULL,
          PRIMARY KEY (key, window)
        ) WITHOUT ROWID;
        CREATE TABLE IF NOT EXISTS receipts (
          id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL,
          state TEXT NOT NULL CHECK(state IN ('pending','accepted','rejected','unknown')),
          updated INTEGER NOT NULL, expires INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS receipts_expiry ON receipts(expires);
      `);
    } catch (error) {
      this.db.close();
      throw error;
    }
  }

  close(): void { this.db.close(); }

  private transaction<T>(action: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  prune(now: number): void {
    const window = Math.floor(now / RATE_WINDOW_MS);
    this.db.prepare('DELETE FROM rate_buckets WHERE (key, window) IN (SELECT key, window FROM rate_buckets WHERE window < ? LIMIT 512)')
      .run(window);
    this.db.prepare('DELETE FROM receipts WHERE id IN (SELECT id FROM receipts WHERE expires <= ? LIMIT 512)').run(now);
  }

  takeRateLimit(ipHash: string, now: number): { allowed: boolean; retryAfter: number } {
    return this.transaction(() => {
      this.prune(now);
      const window = Math.floor(now / RATE_WINDOW_MS);
      const retryAfter = Math.max(1, Math.ceil(((window + 1) * RATE_WINDOW_MS - now) / 1000));
      const count = (key: string) => (this.db.prepare('SELECT count FROM rate_buckets WHERE key = ? AND window = ?')
        .get(key, window) as { count: number } | undefined)?.count ?? 0;
      if (count(`ip:${ipHash}`) >= IP_RATE_LIMIT || count('global') >= GLOBAL_RATE_LIMIT) {
        return { allowed: false, retryAfter };
      }
      for (const key of [`ip:${ipHash}`, 'global']) {
        this.db.prepare(`INSERT INTO rate_buckets(key, window, count) VALUES (?, ?, 1)
          ON CONFLICT(key, window) DO UPDATE SET count = count + 1`).run(key, window);
      }
      return { allowed: true, retryAfter };
    });
  }

  reserve(id: string, fingerprint: string, now: number, pendingLifetimeMs: number): Reservation {
    return this.transaction(() => {
      this.prune(now);
      const existing = this.db.prepare('SELECT fingerprint, state, updated FROM receipts WHERE id = ?').get(id) as Receipt | undefined;
      if (existing) {
        if (existing.fingerprint !== fingerprint) return { state: 'conflict' };
        if (existing.state === 'pending' && now - existing.updated > pendingLifetimeMs) {
          this.db.prepare("UPDATE receipts SET state = 'unknown', updated = ? WHERE id = ?").run(now, id);
          return { state: 'unknown' };
        }
        return { state: existing.state };
      }
      const count = this.db.prepare('SELECT COUNT(*) AS total FROM receipts').get() as { total: number };
      if (count.total >= MAX_RECEIPTS) return { state: 'full' };
      this.db.prepare("INSERT INTO receipts(id, fingerprint, state, updated, expires) VALUES (?, ?, 'pending', ?, ?)")
        .run(id, fingerprint, now, now + RECEIPT_RETENTION_MS);
      return { state: 'new' };
    });
  }

  complete(id: string, state: Exclude<ReceiptState, 'pending'>, now: number): void {
    this.db.prepare('UPDATE receipts SET state = ?, updated = ? WHERE id = ?').run(state, now, id);
  }
}

let cached: { directory: string; store: LeadStore } | undefined;

export function getLeadStore(directory: string): LeadStore {
  if (cached?.directory === directory) return cached.store;
  cached?.store.close();
  cached = undefined;
  const store = new LeadStore(directory);
  cached = { directory, store };
  return store;
}

export function closeLeadStore(): void {
  cached?.store.close();
  cached = undefined;
}
