import { describe, expect, test } from 'bun:test';
import { Pakasir, PakasirApiError, PakasirNotFoundError, PakasirThrottle, paymentLinkUrl } from '../src';

const SLUG = 'depodomain';
const KEY = 'test-api-key-123';

type Call = { url: string; init: RequestInit };

function mockFetch(responses: Array<{ status?: number; body: unknown } | Error>) {
  const calls: Call[] = [];
  const queue = [...responses];
  const fn = (async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const next = queue.shift();
    if (!next) throw new Error('unexpected fetch');
    if (next instanceof Error) throw next;
    const text = typeof next.body === 'string' ? next.body : JSON.stringify(next.body);
    return new Response(text, { status: next.status ?? 200 });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const client = (f: typeof fetch, extra: Partial<ConstructorParameters<typeof Pakasir>[0]> = {}) =>
  new Pakasir({ slug: SLUG, apikey: KEY, fetch: f, throttle: false, ...extra });

const headers = (c: Call) => new Headers(c.init.headers as HeadersInit);

const TX = {
  txn_id: 'vwiqpcriq',
  project: SLUG,
  order_id: 'INV123123',
  amount: 99000,
  fee: 1003,
  total_payment: 100003,
  payment_method: 'qris',
  qr_string: '000201010212',
  va_number: '',
  expired_at: '2025-09-19T01:18:49.678622564Z',
  is_sandbox: false,
  status: 'pending',
  completed_at: null,
};

describe('config', () => {
  test('requires slug and apikey', () => {
    expect(() => new Pakasir({ slug: '', apikey: KEY })).toThrow();
    expect(() => new Pakasir({ slug: SLUG, apikey: '' })).toThrow();
  });
});

describe('createTransaction', () => {
  test('POSTs method+amount to the v2 endpoint with X-Api-Key', async () => {
    const { fn, calls } = mockFetch([{ body: TX }]);
    const tx = await client(fn).createTransaction('qris', 'INV123123', 99000);

    expect(tx).toEqual(TX as any);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://app.pakasir.com/api/v2/create-transaction/${SLUG}/INV123123`);
    expect(calls[0].init.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ method: 'qris', amount: 99000 });
    expect(headers(calls[0]).get('X-Api-Key')).toBe(KEY);
    expect(headers(calls[0]).get('Content-Type')).toBe('application/json');
    expect(String(calls[0].init.body)).not.toContain(KEY);
  });

  test('encodes order_id in the path', async () => {
    const { fn, calls } = mockFetch([{ body: TX }]);
    await client(fn).createTransaction('qris', 'INV 1/2', 99000);
    expect(calls[0].url).toEndWith('/INV%201%2F2');
  });

  test('validates method and per-method limits before calling out', async () => {
    const { fn, calls } = mockFetch([]);
    const c = client(fn);
    await expect(c.createTransaction('atm_bersama_va' as any, 'INV1', 20000)).rejects.toThrow(/Unsupported/);
    await expect(c.createTransaction('qris', 'INV1', 499)).rejects.toThrow(/between/);
    await expect(c.createTransaction('qris', 'INV1', 10_000_001)).rejects.toThrow(/between/);
    await expect(c.createTransaction('bni_va', 'INV1', 9_999)).rejects.toThrow(/between/);
    await expect(c.createTransaction('qris', 'INV1', 1000.5)).rejects.toThrow(/integer/);
    await expect(c.createTransaction('qris', '  ', 1000)).rejects.toThrow(/order_id/);
    await expect(c.createTransaction('payment_link' as any, 'INV1', 1000)).rejects.toThrow(/createPaymentLink/);
    expect(calls).toHaveLength(0);
  });

  test('throws PakasirApiError with gateway message, never leaking the key', async () => {
    const { fn } = mockFetch([{ status: 400, body: { message: `bad key ${KEY}` } }]);
    const err = await client(fn)
      .createTransaction('qris', 'INV1', 1000)
      .catch((e) => e);
    expect(err).toBeInstanceOf(PakasirApiError);
    expect(err.status).toBe(400);
    expect(err.message).not.toContain(KEY);
  });

  test('does not retry writes on 429', async () => {
    const { fn, calls } = mockFetch([{ status: 429, body: { message: 'Rate limit exceeded' } }]);
    await expect(client(fn).createTransaction('qris', 'INV1', 1000)).rejects.toBeInstanceOf(PakasirApiError);
    expect(calls).toHaveLength(1);
  });

  test('non-JSON response becomes a typed error', async () => {
    const { fn } = mockFetch([{ status: 503, body: '<html>503</html>' }]);
    const err = await client(fn)
      .createTransaction('qris', 'INV1', 1000)
      .catch((e) => e);
    expect(err).toBeInstanceOf(PakasirApiError);
    expect(err.status).toBe(503);
  });

  test('network failure becomes status 0', async () => {
    const { fn } = mockFetch([new Error('ECONNREFUSED')]);
    const err = await client(fn)
      .createTransaction('qris', 'INV1', 1000)
      .catch((e) => e);
    expect(err).toBeInstanceOf(PakasirApiError);
    expect(err.status).toBe(0);
  });

  test('expectSandbox rejects mismatched environment', async () => {
    const { fn } = mockFetch([{ body: TX }]);
    await expect(client(fn, { expectSandbox: true }).createTransaction('qris', 'INV1', 1000)).rejects.toThrow(/environment mismatch/);
  });

  test('rejects a response without txn_id', async () => {
    const { fn } = mockFetch([{ body: { message: 'ok' } }]);
    await expect(client(fn).createTransaction('qris', 'INV1', 1000)).rejects.toThrow(/txn_id/);
  });
});

describe('payment link', () => {
  test('createPaymentLink sends method payment_link and applies options', async () => {
    const { fn, calls } = mockFetch([{ body: { txn_id: 'abc123', payment_link: 'https://app.pakasir.com/pay-v2/abc123' } }]);
    const res = await client(fn).createPaymentLink('INV1', 500, { qrisOnly: true, redirect: 'https://shop.example/done?x=1' });

    expect(JSON.parse(String(calls[0].init.body))).toEqual({ method: 'payment_link', amount: 500 });
    expect(res.txn_id).toBe('abc123');
    const url = new URL(res.payment_link);
    expect(url.origin + url.pathname).toBe('https://app.pakasir.com/pay-v2/abc123');
    expect(url.searchParams.get('qris_only')).toBe('1');
    expect(url.searchParams.get('redirect')).toBe('https://shop.example/done?x=1');
  });

  test('createPaymentLink enforces the 50.000.000 max', async () => {
    const { fn } = mockFetch([]);
    await expect(client(fn).createPaymentLink('INV1', 50_000_001)).rejects.toThrow(/between/);
  });

  test('getPaymentLink / paymentLinkUrl build the hosted URL without calling out', () => {
    const { fn, calls } = mockFetch([]);
    expect(client(fn).getPaymentLink('abc123')).toBe('https://app.pakasir.com/pay-v2/abc123');
    expect(paymentLinkUrl('abc123', { qrisOnly: true })).toBe('https://app.pakasir.com/pay-v2/abc123?qris_only=1');
    expect(paymentLinkUrl('abc123', { redirect: 'https://a.b/c' })).toBe('https://app.pakasir.com/pay-v2/abc123?redirect=https%3A%2F%2Fa.b%2Fc');
    expect(() => paymentLinkUrl('')).toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe('getTransactionStatus', () => {
  const DETAIL = { txn_id: 'vwiqpcriq', order_id: 'INV123123', amount: 99000, is_sandbox: false, status: 'completed', completed_at: '2025-09-19T01:18:49Z' };

  test('GETs the v2 status endpoint by txn_id', async () => {
    const { fn, calls } = mockFetch([{ body: DETAIL }]);
    const tx = await client(fn).getTransactionStatus('vwiqpcriq');
    expect(tx).toEqual(DETAIL as any);
    expect(calls[0].url).toBe(`https://app.pakasir.com/api/v2/transaction-status/${SLUG}/vwiqpcriq`);
    expect(calls[0].init.method).toBe('GET');
    expect(headers(calls[0]).get('X-Api-Key')).toBe(KEY);
    expect(calls[0].url).not.toContain(KEY);
  });

  test('404 becomes PakasirNotFoundError', async () => {
    const { fn } = mockFetch([{ status: 404, body: { message: 'Transaction not found' } }]);
    await expect(client(fn).getTransactionStatus('nope')).rejects.toBeInstanceOf(PakasirNotFoundError);
  });

  test('retries a transient 429', async () => {
    const { fn, calls } = mockFetch([{ status: 429, body: { message: 'Rate limit exceeded' } }, { body: DETAIL }]);
    const tx = await client(fn).getTransactionStatus('vwiqpcriq');
    expect(tx.status).toBe('completed');
    expect(calls).toHaveLength(2);
  });

  test('requires txn_id', async () => {
    const { fn } = mockFetch([]);
    await expect(client(fn).getTransactionStatus('')).rejects.toThrow(/txn_id/);
  });
});

describe('cancelTransaction', () => {
  test('POSTs to the v2 cancel endpoint without a body', async () => {
    const { fn, calls } = mockFetch([{ body: { message: 'Berhasil batalkan transaksi' } }]);
    const res = await client(fn).cancelTransaction('vwiqpcriq');
    expect(res).toEqual({ message: 'Berhasil batalkan transaksi' });
    expect(calls[0].url).toBe(`https://app.pakasir.com/api/v2/cancel-transaction/${SLUG}/vwiqpcriq`);
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBeUndefined();
    expect(headers(calls[0]).get('X-Api-Key')).toBe(KEY);
  });
});

describe('getPaymentFees', () => {
  test('GETs the public calculator without the api key and keeps numeric entries', async () => {
    const { fn, calls } = mockFetch([{ body: { qris: 394, bni_va: 3500, atm_bersama_va: 3500, junk: 'x' } }]);
    const fees = await client(fn).getPaymentFees(12000);
    expect(fees).toEqual({ qris: 394, bni_va: 3500, atm_bersama_va: 3500 });
    expect(calls[0].url).toBe('https://app.pakasir.com/api/v2/payment-fee/12000');
    expect(headers(calls[0]).get('X-Api-Key')).toBeNull();
  });

  test('rejects non-positive amounts', async () => {
    const { fn } = mockFetch([]);
    await expect(client(fn).getPaymentFees(0)).rejects.toThrow();
  });
});

describe('baseUrl', () => {
  test('is configurable', async () => {
    const { fn, calls } = mockFetch([{ body: { message: 'ok' } }]);
    await client(fn, { baseUrl: 'https://sandbox.example/' }).cancelTransaction('t1');
    expect(calls[0].url).toBe(`https://sandbox.example/api/v2/cancel-transaction/${SLUG}/t1`);
  });
});

describe('PakasirThrottle', () => {
  test('spaces requests 500ms apart and status calls 4s per key', async () => {
    let now = 0;
    const slept: number[] = [];
    const t = new PakasirThrottle({ now: () => now, sleep: async (ms) => void slept.push(ms) });

    await t.acquire();
    await t.acquire();
    expect(slept).toEqual([500]);

    now = 10_000;
    slept.length = 0;
    await t.acquire('tx1');
    await t.acquire('tx1');
    expect(slept[0]).toBe(4_000);
  });
});
