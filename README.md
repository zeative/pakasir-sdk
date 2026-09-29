# Pakasir Payment Gateway

<img src="media/pakasir-gap.png" width="200" alt="Pakasir Logo" align="right"/>

SDK TypeScript ringan untuk integrasi pembayaran digital Indonesia [pakasir.com](https://pakasir.com).
Dukung QRIS, Virtual Account multi-bank & Payment Link dalam hitungan menit — Pakasir API v2.

<a href="https://www.npmjs.com/package/pakasir-sdk"><img src="https://img.shields.io/npm/v/pakasir-sdk.svg" alt="NPM Version"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/languages/code-size/zeative/pakasir-sdk" alt="GitHub Code Size"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=flat-square&logo=typescript" alt="TypeScript"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/license/zeative/pakasir-sdk" alt="GitHub License"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/stars/zeative/pakasir-sdk" alt="GitHub Stars"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/forks/zeative/pakasir-sdk" alt="GitHub Forks"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/watchers/zeative/pakasir-sdk" alt="GitHub Watchers"></a>

[Installation](#-installation) · [Quick Start](#-quick-start) · [Configuration](#️-configuration) · [Payment Methods](#-payment-methods) · [API Reference](#-api-reference) · [Webhook](#-webhook) · [Migrating from v1 to v2](#-migrating-from-v1-to-v2)

> **v2.0.0 targets Pakasir API v2.** Pakasir switches API v1 off on **20 October 2026**; `pakasir-sdk@1.x` only speaks v1. See [Migrating from v1 to v2](#-migrating-from-v1-to-v2) and the [CHANGELOG](CHANGELOG.md).

<br />

## 📦 Installation

```bash
npm install pakasir-sdk
# or
pnpm add pakasir-sdk
# or
bun add pakasir-sdk
```

Requires Node.js 20+ (or Bun). Server-side only: it needs your API key and uses `node:crypto` for webhooks.

## ⚡ Quick Start

```typescript
import { Pakasir } from 'pakasir-sdk';

const pakasir = new Pakasir({
  slug: process.env.PAKASIR_SLUG!,
  apikey: process.env.PAKASIR_API_KEY!,
});

const tx = await pakasir.createTransaction('qris', 'INV-12345', 99_000);

// Store tx.txn_id with your order: status and cancel use it.
console.log(tx.txn_id, tx.qr_string, tx.total_payment, tx.expired_at);
```

## 🛠️ Configuration

| Option          | Type           | Default                   | Description                                                                                         |
| :-------------- | :------------- | :------------------------ | :-------------------------------------------------------------------------------------------------- |
| `slug`          | `string`       | —                         | Required. [Project](https://app.pakasir.com/projects) slug.                                         |
| `apikey`        | `string`       | —                         | Required. Project API key, sent as the `X-Api-Key` header.                                          |
| `baseUrl`       | `string`       | `https://app.pakasir.com` | API origin.                                                                                         |
| `fetch`         | `typeof fetch` | global `fetch`            | Custom fetch (proxies, tests).                                                                      |
| `timeout`       | `number`       | `20000`                   | Per-request timeout (ms).                                                                           |
| `throttle`      | `boolean`      | `true`                    | Pace requests in-process: 2 req/s overall, one status call per 4 s per transaction.                 |
| `expectSandbox` | `boolean`      | unset                     | If set, create/status responses whose `is_sandbox` differs are rejected (catches a wrong slug/key). |

New projects start in **Sandbox mode** until the project KYC is approved; `is_sandbox` on every response tells you which mode a transaction belongs to.

## 💰 Payment Methods

| Method            | Code             | Amount (IDR)        |
| ----------------- | ---------------- | ------------------- |
| Payment Link      | `payment_link`   | 500 – 50.000.000    |
| QRIS              | `qris`           | 500 – 10.000.000    |
| BRI VA            | `bri_va`         | 10.000 – 50.000.000 |
| BNI VA            | `bni_va`         | 10.000 – 50.000.000 |
| CIMB Niaga VA     | `cimb_niaga_va`  | 10.000 – 50.000.000 |
| Permata VA        | `permata_va`     | 10.000 – 50.000.000 |
| Maybank VA        | `maybank_va`     | 10.000 – 50.000.000 |
| Bank Neo Commerce | `bnc_va`         | 10.000 – 50.000.000 |
| Artha Graha VA    | `artha_graha_va` | 10.000 – 50.000.000 |
| Sahabat Sampoerna | `sampoerna_va`   | 10.000 – 50.000.000 |

`payment_link` is created with [`createPaymentLink`](#create-payment-link); the rest with [`createTransaction`](#create-transaction). Amounts must be integers inside these limits; the SDK throws before calling the API otherwise. For fees see [`getPaymentFees`](#payment-fees) or [Pakasir pricing](https://pakasir.com/p/pricing).

## 📖 API Reference

> **Quick Jump:** [Create Transaction](#create-transaction) · [Create Payment Link](#create-payment-link) · [Get Payment Link](#get-payment-link) · [Transaction Status](#transaction-status) · [Cancel Transaction](#cancel-transaction) · [Payment Fees](#payment-fees) · [Watch Transaction](#watch-transaction) · [Errors](#errors)

### Create Transaction

`POST /api/v2/create-transaction/{slug}/{order_id}` — creates a QRIS or VA transaction. **Find-or-create**: repeating the call with the same `order_id` and body returns the same transaction.

```typescript
const tx = await pakasir.createTransaction('bni_va', 'INV-12345', 150_000);
```

```typescript
type Transaction = {
  txn_id: string; // keep this
  project: string;
  order_id: string;
  amount: number;
  fee: number;
  total_payment: number; // amount + fee, what the customer pays
  payment_method: PaymentMethod;
  qr_string: string; // QRIS payload, "" for VA
  va_number: string; // VA number, "" for QRIS
  expired_at: string; // RFC 3339 UTC
  is_sandbox: boolean;
  status: 'pending' | 'completed' | 'canceled';
  completed_at: string | null;
};
```

---

### Create Payment Link

Creates a transaction paid on Pakasir's hosted page (`https://app.pakasir.com/pay-v2/{txn_id}`), where the customer picks the method.

```typescript
const { txn_id, payment_link } = await pakasir.createPaymentLink('INV-12345', 99_000, {
  qrisOnly: true, // ?qris_only=1
  redirect: 'https://shop.example/thanks', // ?redirect=
});
```

The response only contains `txn_id` and `payment_link` (no fee or expiry); use [status](#transaction-status) or the [webhook](#-webhook) to learn when it is paid.

---

### Get Payment Link

Builds the hosted page URL for an existing `txn_id`. No API call.

```typescript
pakasir.getPaymentLink('vwiqpcriq', { qrisOnly: true });
// https://app.pakasir.com/pay-v2/vwiqpcriq?qris_only=1

import { paymentLinkUrl } from 'pakasir-sdk'; // standalone version
paymentLinkUrl('vwiqpcriq', { redirect: 'https://shop.example/thanks' });
```

---

### Transaction Status

`GET /api/v2/transaction-status/{slug}/{txn_id}`

```typescript
const detail = await pakasir.getTransactionStatus(tx.txn_id);
// { txn_id, order_id, amount, is_sandbox, status, completed_at }
```

- `status`: `pending` (awaiting payment), `completed` (paid), `canceled` (canceled in the dashboard or unpaid for 24 hours).
- v2 does **not** check the amount server-side: compare `order_id` and `amount` with your own record before fulfilling.
- Pakasir allows one status call per 4 seconds per transaction. The SDK waits for the slot (it does not serve cached answers) and retries transient 429/503 errors.

---

### Cancel Transaction

`POST /api/v2/cancel-transaction/{slug}/{txn_id}`

```typescript
const { message } = await pakasir.cancelTransaction(tx.txn_id);
// "Berhasil batalkan transaksi"
```

---

### Payment Fees

`GET /api/v2/payment-fee/{amount}` — public fee calculator (the API key is not sent).

```typescript
const fees = await pakasir.getPaymentFees(12_000);
// { qris: 394, bni_va: 3500, sampoerna_va: 2000, ... }
```

An estimate for display. The fee actually charged is `fee` on the create response. The map can contain methods v2 no longer creates (e.g. `atm_bersama_va`).

---

### Watch Transaction

Polls the status and reports changes. Stops automatically on `completed` / `canceled`, on `timeout`, or with `stopWatch`. Prefer the [webhook](#-webhook) in production; polling spends rate-limit budget.

```typescript
pakasir.watchTransaction(tx.txn_id, {
  interval: 5000,
  timeout: 600000,
  onStatusChange: (detail) => console.log(detail.status),
  onError: (error) => console.error(error),
});

pakasir.stopWatch(tx.txn_id);
pakasir.stopAllWatches();
```

| Option           | Type                                  | Default  | Description                                   |
| :--------------- | :------------------------------------ | :------- | :-------------------------------------------- |
| `interval`       | `number`                              | `5000`   | Polling interval in ms (minimum 4000)         |
| `timeout`        | `number`                              | `600000` | Auto-stop after this many ms (10 minutes)     |
| `onStatusChange` | `(detail: TransactionDetail) => void` | -        | Called with the first status and every change |
| `onError`        | `(error: Error) => void`              | -        | Called on errors                              |

---

### Errors

| Class                  | When                                                                          |
| :--------------------- | :---------------------------------------------------------------------------- |
| `PakasirApiError`      | Any API or validation error. `status` (HTTP, `0` = unreachable) + `endpoint`. |
| `PakasirNotFoundError` | 404, e.g. unknown `txn_id`. Extends `PakasirApiError`.                        |
| `PakasirWebhookError`  | `parseWebhook` got an invalid body.                                           |

The API key is redacted from every error message.

## 🔔 Webhook

Pakasir `POST`s to your project's webhook URL **when a payment succeeds**, with the project's webhook secret (found and reset on the project detail page) in the `X-Secret` header. Answer `200`.

```typescript
import express from 'express';
import { parseWebhook, verifyWebhook, WEBHOOK_SECRET_HEADER } from 'pakasir-sdk';

app.post('/pakasir/webhook', express.json(), async (req, res) => {
  if (!verifyWebhook(req.get(WEBHOOK_SECRET_HEADER), process.env.PAKASIR_WEBHOOK_SECRET)) {
    return res.sendStatus(401);
  }

  const event = parseWebhook(req.body);
  // { txn_id, order_id, amount, is_sandbox, status, completed_at }

  // Recommended: re-check with the API and compare against your own order before fulfilling.
  const detail = await pakasir.getTransactionStatus(event.txn_id);
  // ...compare detail.order_id / detail.amount with your record, then mark paid (idempotently)

  res.sendStatus(200);
});
```

- `verifyWebhook(headerValue, secret)` returns `true` only on an exact match. The comparison is constant-time (SHA-256 of both sides, then `crypto.timingSafeEqual`). It returns `false` for a missing header, a wrong value, **or an empty/unset secret** (fails closed).
- `verifyWebhookSecret(headerValue, secret)` returns `{ ok: true }` or `{ ok: false, reason: 'secret_unconfigured' | 'missing_header' | 'mismatch' }` for logging.
- `parseWebhook(body)` accepts an object, a JSON string or bytes, and throws `PakasirWebhookError` if `txn_id`, `order_id`, `amount`, `is_sandbox` or `status` is missing.

## 🔄 Migrating from v1 to v2

v2 transactions are identified by **`txn_id`** (returned by create), not by `order_id` + `amount`. Save `txn_id` alongside your order. Transactions created through v1 have no `txn_id` and cannot be queried with this version.

| v1 (`pakasir-sdk@1.x`)                                    | v2 (`pakasir-sdk@2.x`)                                                       |
| :-------------------------------------------------------- | :--------------------------------------------------------------------------- |
| API key in body / query string                            | `X-Api-Key` header (automatic)                                               |
| `createPayment(method, order_id, amount, redirect_url)`   | `createTransaction(method, order_id, amount)`                                |
| `createPayment('all', ...)` / `getPaymentUrl('all', ...)` | `createPaymentLink(order_id, amount, { redirect })`                          |
| `getPaymentUrl('qris', ...)` (`qris_only=1`)              | `createPaymentLink(order_id, amount, { qrisOnly: true })`                    |
| `getPaymentUrl(...)` (no API call)                        | `getPaymentLink(txn_id, options)` / `paymentLinkUrl(txn_id, options)`        |
| `/pay/{slug}/{amount}?order_id=...` URLs                  | `/pay-v2/{txn_id}` URLs                                                      |
| `detailPayment(order_id, amount)`                         | `getTransactionStatus(txn_id)`                                               |
| `cancelPayment(order_id, amount)` → `PaymentPayload`      | `cancelTransaction(txn_id)` → `{ message }`                                  |
| `simulationPayment(order_id, amount)`                     | Removed (no v2 endpoint). Pay sandbox transactions from the dashboard.       |
| `watchPayment(order_id, amount, opts)`                    | `watchTransaction(txn_id, opts)` (interval ≥ 4 s, auto-stops when final)     |
| `stopWatch(order_id, amount)`                             | `stopWatch(txn_id)` / `stopAllWatches()`                                     |
| `payment_number`                                          | `qr_string` (QRIS) or `va_number` (VA)                                       |
| `payment_url`, `redirect_url` on the payload              | `createPaymentLink(...).payment_link`                                        |
| Locally computed `fee`                                    | `fee` / `total_payment` from the API; estimate with `getPaymentFees(amount)` |
| `PaymentPayload` type                                     | `Transaction`, `TransactionDetail`, `PaymentLink`, `CancelResult`            |
| `atm_bersama_va`, `paypal`, `all` methods                 | Removed (see [Payment Methods](#-payment-methods))                           |
| `order_id` silently sanitized, min 5 chars                | Sent as-is (URL-encoded); must be non-empty                                  |
| Webhook: no authentication                                | `verifyWebhook(req.get('X-Secret'), secret)` + `parseWebhook(body)`          |
| Status `expired`                                          | Unpaid transactions become `canceled` after 24 hours                         |
| Errors: plain `Error`                                     | `PakasirApiError` / `PakasirNotFoundError` / `PakasirWebhookError`           |

Before:

```typescript
const p = await pakasir.createPayment('qris', 'INV-12345', 99_000);
showQr(p.payment_number);
const d = await pakasir.detailPayment('INV-12345', 99_000);
```

After:

```typescript
const tx = await pakasir.createTransaction('qris', 'INV-12345', 99_000);
await db.orders.update('INV-12345', { txn_id: tx.txn_id });
showQr(tx.qr_string);
const d = await pakasir.getTransactionStatus(tx.txn_id);
if (d.order_id !== 'INV-12345' || d.amount !== 99_000) throw new Error('mismatch');
```

## 🧪 Development

Tests use `bun test` with a mocked `fetch` (no API key needed).

| Script           | What it does                      |
| :--------------- | :-------------------------------- |
| `test`           | `bun test __tests__`              |
| `typecheck`      | `tsc --noEmit` over src and tests |
| `build`          | tsup, CJS + ESM + d.ts in `dist/` |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create new branch: `git checkout -b feature/my-feature`.
3.  Commit your changes: `git commit -m 'Add some feature'`.
4.  Push to the branch: `git push origin feature/my-feature`.
5.  Open Pull Request.

## 🎯 Issues & Feedback

**If you encounter any problems or have feature requests, please open an [issue](https://github.com/zeative/pakasir-sdk/issues)**

- [Buy me coffee ☕](https://saweria.co/zaadevofc)
- [Ko-Fi](https://ko-fi.com/zaadevofc)
- [Trakteer](https://trakteer.id/zaadevofc)
- ⭐ Star the repo on GitHub

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](https://github.com/zeative/pakasir-sdk/blob/main/LICENSE) for details.
