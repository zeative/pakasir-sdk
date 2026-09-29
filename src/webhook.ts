import { createHash, timingSafeEqual } from 'node:crypto';
import { WEBHOOK_SECRET_HEADER } from './consts';
import { PakasirWebhookError } from './errors';
import { WebhookPayload } from './types';

export { WEBHOOK_SECRET_HEADER };

export type WebhookSecretCheck = { ok: true } | { ok: false; reason: 'secret_unconfigured' | 'missing_header' | 'mismatch' };

const digest = (v: string) => createHash('sha256').update(v, 'utf8').digest();

/**
 * Checks the `X-Secret` header of a webhook delivery against your project's webhook secret
 * and tells you why it failed. Constant-time: both sides are SHA-256 hashed and compared
 * with `crypto.timingSafeEqual`, so neither the content nor the length of the secret leaks.
 *
 * Fails closed: an empty/unset `secret` rejects every delivery.
 */
export function verifyWebhookSecret(headerValue: string | string[] | null | undefined, secret: string | null | undefined): WebhookSecretCheck {
  if (!secret) return { ok: false, reason: 'secret_unconfigured' };
  const received = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!received) return { ok: false, reason: 'missing_header' };
  const a = digest(received);
  const b = digest(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'mismatch' };
  return { ok: true };
}

/**
 * `true` only when `headerValue` (the `X-Secret` request header) equals `secret`.
 * Returns `false` for a missing header, a wrong value, or an empty/unset secret.
 *
 * A valid secret proves the call came from Pakasir; for money-moving decisions, still
 * re-check the transaction with `getTransactionStatus(txn_id)` and compare `order_id`
 * and `amount` with your own records.
 */
export function verifyWebhook(headerValue: string | string[] | null | undefined, secret: string | null | undefined): boolean {
  return verifyWebhookSecret(headerValue, secret).ok;
}

/**
 * Parses and validates a webhook body (a raw JSON string, Buffer/Uint8Array, or an already-parsed object).
 * Throws `PakasirWebhookError` when a required field is missing or has the wrong type.
 */
export function parseWebhook(body: unknown): WebhookPayload {
  let data: unknown = body;
  if (typeof data === 'string' || data instanceof Uint8Array) {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    try {
      data = JSON.parse(text);
    } catch {
      throw new PakasirWebhookError('Webhook body is not valid JSON');
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new PakasirWebhookError('Webhook body must be a JSON object');

  const p = data as Record<string, unknown>;
  const str = (k: string) => {
    const v = p[k];
    if (typeof v !== 'string' || !v.trim()) throw new PakasirWebhookError(`Webhook body is missing "${k}"`);
    return v.trim();
  };

  const amount = typeof p.amount === 'string' && p.amount.trim() !== '' ? Number(p.amount) : p.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) throw new PakasirWebhookError('Webhook body is missing "amount"');
  if (typeof p.is_sandbox !== 'boolean') throw new PakasirWebhookError('Webhook body is missing "is_sandbox"');
  const completed_at = typeof p.completed_at === 'string' && p.completed_at ? p.completed_at : null;

  return {
    txn_id: str('txn_id'),
    order_id: str('order_id'),
    amount,
    is_sandbox: p.is_sandbox,
    status: str('status'),
    completed_at,
  };
}
