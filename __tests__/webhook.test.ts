import { describe, expect, test } from 'bun:test';
import { PakasirWebhookError, WEBHOOK_SECRET_HEADER, parseWebhook, verifyWebhook, verifyWebhookSecret } from '../src';

const SECRET = 'whsec-test-value';

describe('verifyWebhook', () => {
  test('header name is X-Secret', () => {
    expect(WEBHOOK_SECRET_HEADER).toBe('X-Secret');
  });

  test('valid secret', () => {
    expect(verifyWebhook(SECRET, SECRET)).toBe(true);
    expect(verifyWebhookSecret(SECRET, SECRET)).toEqual({ ok: true });
    expect(verifyWebhook([SECRET], SECRET)).toBe(true);
  });

  test('wrong secret (same and different length)', () => {
    expect(verifyWebhook('whsec-test-valuX', SECRET)).toBe(false);
    expect(verifyWebhook('short', SECRET)).toBe(false);
    expect(verifyWebhook(SECRET + 'x', SECRET)).toBe(false);
    expect(verifyWebhookSecret('nope', SECRET)).toEqual({ ok: false, reason: 'mismatch' });
  });

  test('missing header', () => {
    expect(verifyWebhook(undefined, SECRET)).toBe(false);
    expect(verifyWebhook(null, SECRET)).toBe(false);
    expect(verifyWebhook('', SECRET)).toBe(false);
    expect(verifyWebhookSecret(undefined, SECRET)).toEqual({ ok: false, reason: 'missing_header' });
  });

  test('unset secret fails closed', () => {
    expect(verifyWebhook(SECRET, undefined)).toBe(false);
    expect(verifyWebhook('', '')).toBe(false);
    expect(verifyWebhook(undefined, undefined)).toBe(false);
    expect(verifyWebhookSecret(SECRET, '')).toEqual({ ok: false, reason: 'secret_unconfigured' });
  });
});

describe('parseWebhook', () => {
  const BODY = { txn_id: 'vwiqpcriq', order_id: 'INV123123', amount: 99000, is_sandbox: false, status: 'completed', completed_at: '2025-09-19T01:18:49Z' };

  test('parses an object, a JSON string and bytes', () => {
    expect(parseWebhook(BODY)).toEqual(BODY);
    expect(parseWebhook(JSON.stringify(BODY))).toEqual(BODY);
    expect(parseWebhook(new TextEncoder().encode(JSON.stringify(BODY)))).toEqual(BODY);
  });

  test('ignores unknown fields and normalises completed_at', () => {
    const p = parseWebhook({ ...BODY, extra: 1, completed_at: undefined });
    expect(p).toEqual({ ...BODY, completed_at: null });
  });

  test('rejects invalid bodies', () => {
    expect(() => parseWebhook('not json')).toThrow(PakasirWebhookError);
    expect(() => parseWebhook(null)).toThrow(PakasirWebhookError);
    expect(() => parseWebhook([])).toThrow(PakasirWebhookError);
    expect(() => parseWebhook({ ...BODY, txn_id: undefined })).toThrow(/txn_id/);
    expect(() => parseWebhook({ ...BODY, amount: 'abc' })).toThrow(/amount/);
    expect(() => parseWebhook({ ...BODY, is_sandbox: undefined })).toThrow(/is_sandbox/);
  });
});
