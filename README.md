# Pakasir Payment Gateway

<img src="media/pakasir-gap.png" width="200" alt="Pakasir Logo" align="right"/>

SDK TypeScript ringan untuk integrasi pembayaran digital Indonesia [pakasir.com](https://pakasir.com).
Dukung QRIS, Virtual Account multi-bank & PayPal dalam hitungan menit.

<a href="https://www.npmjs.com/package/pakasir-sdk"><img src="https://img.shields.io/npm/v/pakasir-sdk.svg" alt="NPM Version"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/languages/code-size/zeative/pakasir-sdk" alt="GitHub Code Size"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=flat-square&logo=typescript" alt="TypeScript"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/license/zeative/pakasir-sdk" alt="GitHub License"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/stars/zeative/pakasir-sdk" alt="GitHub Stars"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/forks/zeative/pakasir-sdk" alt="GitHub Forks"></a>
<a href="https://github.com/zeative/pakasir-sdk"><img src="https://img.shields.io/github/watchers/zeative/pakasir-sdk" alt="GitHub Watchers"></a>

[Installation](#-installation) · [Quick Start](#-quick-start) · [Configuration](#️-configuration) · [Payment Methods](#-payment-methods) · [API Reference](#-api-reference)

<br />

## 📦 Installation

Install `pakasir-sdk` using your preferred package manager:

```bash
npm install pakasir-sdk
# or
pnpm add pakasir-sdk
# or
bun add pakasir-sdk
```

## ⚡ Quick Start

Here is a minimal example to create a payment:

```typescript
import { Pakasir } from 'pakasir-sdk';

const pakasir = new Pakasir({
  slug: 'your-slug',
  apikey: 'your-api-key',
});

const result = await pakasir.createPayment('qris', 'your-order-id', 10000);

console.log(result);
```

## 🛠️ Configuration

The `Pakasir` constructor accepts a configuration object:

| Option   | Type     | Description                                                 |
| :------- | :------- | :---------------------------------------------------------- |
| `slug`   | `string` | Required. [Project](https://app.pakasir.com/projects) slug. |
| `apikey` | `string` | Required. [API key](https://app.pakasir.com/projects).      |

## 💰 Payment Methods

For more information about payment methods, please visit [Pakasir Biaya](https://pakasir.com/p/pricing).

| Method         | Code             | Fee              |
| -------------- | ---------------- | ---------------- |
| All Methods    | `all`            | Varies           |
| QRIS           | `qris`           | 0.7% - 1%        |
| PayPal         | `paypal`         | 1% (min Rp3.000) |
| BNI VA         | `bni_va`         | Rp3.500          |
| BRI VA         | `bri_va`         | Rp3.500          |
| CIMB Niaga VA  | `cimb_niaga_va`  | Rp3.500          |
| Maybank VA     | `maybank_va`     | Rp3.500          |
| Permata VA     | `permata_va`     | Rp3.500          |
| BNC VA         | `bnc_va`         | Rp3.500          |
| ATM Bersama VA | `atm_bersama_va` | Rp3.500          |
| Sampoerna VA   | `sampoerna_va`   | Rp2.000          |
| Artha Graha VA | `artha_graha_va` | Rp2.000          |

## 📖 API Reference

> **Quick Jump:** [Create Payment](#create-payment) · [Get Payment URL](#get-payment-url) · [Detail Payment](#detail-payment) · [Cancel Payment](#cancel-payment) · [Simulation Payment](#simulation-payment) · [Watch Payment](#watch-payment) · [Stop Watch](#stop-watch)

### Create Payment

Create a new payment transaction via API.

```typescript
const payment = await pakasir.createPayment('qris', 'ORDER-12345', 100_000, 'https://example.com/success');

console.log(payment);
```

| Parameter      | Type            | Description                                              |
| :------------- | :-------------- | :------------------------------------------------------- |
| `method`       | `PaymentMethod` | Payment method code [Payment Methods](#-payment-methods) |
| `order_id`     | `string`        | Unique order ID (min 5 characters)                       |
| `amount`       | `number`        | Amount in Rupiah (min Rp500)                             |
| `redirect_url` | `string?`       | Optional redirect URL after payment                      |

---

### Get Payment URL

Generate payment URL without API call. Useful for client-side redirects.

```typescript
const payment = pakasir.getPaymentUrl('qris', 'ORDER-12345', 100_000);

console.log(payment);
```

---

### Detail Payment

Retrieve current status of a payment.

```typescript
const detail = await pakasir.detailPayment('ORDER-12345', 100_000);

console.log(detail);
```

---

### Cancel Payment

Cancel an existing pending payment.

```typescript
const canceled = await pakasir.cancelPayment('ORDER-12345', 100_000);

console.log(canceled);
```

---

### Simulation Payment

Simulate a successful payment for testing purposes.

```typescript
const simulated = await pakasir.simulationPayment('ORDER-12345', 100_000);

console.log(simulated);
```

---

### Watch Payment

Monitor payment status changes in real-time with polling.

```typescript
pakasir.watchPayment('ORDER-12345', 100_000, {
  interval: 3000,
  timeout: 600000,

  onStatusChange: (payment) => {
    console.log('Status:', payment);
  },

  onError: (error) => console.error(error),
});
```

| Option           | Type                                | Default  | Description                      |
| :--------------- | :---------------------------------- | :------- | :------------------------------- |
| `interval`       | `number`                            | `3000`   | Polling interval in milliseconds |
| `timeout`        | `number`                            | `600000` | Auto-stop timeout (10 minutes)   |
| `onStatusChange` | `(payment: PaymentPayload) => void` | -        | Callback on status change        |
| `onError`        | `(error: Error) => void`            | -        | Callback on error                |

---

### Stop Watch

Manually stop watching a payment.

```typescript
pakasir.stopWatch('ORDER-12345', 100_000);
```

---

### PaymentPayload Type

Response type returned by all payment methods:

```typescript
type PaymentPayload = {
  project: string;
  order_id: string;
  amount: number;
  fee: number;
  status: 'pending' | 'canceled' | 'completed';
  total_payment: number;
  payment_method: string;
  payment_number: string | null;
  payment_url: string | null;
  redirect_url: string | null;
  expired_at: string | Date | null;
  completed_at: string | Date | null;
};
```

---

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
