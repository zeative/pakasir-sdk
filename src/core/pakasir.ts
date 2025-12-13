import { BASE_API_URL } from '../consts';
import { PakasirConfig, PaymentMethod, PaymentPayload } from '../types';
import { sanitizeUrlSafe } from '../utils/helpers';

export interface WatchOptions {
  interval?: number;
  timeout?: number;
  onStatusChange?: (payment: PaymentPayload) => void;
  onError?: (error: Error) => void;
}

export class Pakasir {
  private watchers: Map<string, NodeJS.Timeout> = new Map();
  private watchTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private lastStatuses: Map<string, string> = new Map();

  constructor(public config: PakasirConfig) {
    this.initialize();
  }

  initialize() {
    const { slug, apikey } = this.config;

    if (!slug || !apikey) {
      throw new Error('Pakasir config is not valid!');
    }
  }

  getPaymentUrl(method: PaymentMethod, order_id: string, amount: number, redirect_url?: string): PaymentPayload {
    order_id = sanitizeUrlSafe(order_id);

    const { slug } = this.config;

    if (order_id?.length < 5) throw new Error('Order ID must be at least 5 characters long!');
    if (amount < 500) throw new Error('Amount must be at least Rp500!');

    let payment_url;
    let payment_number;

    let expired_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    let fee = 0;

    redirect_url = redirect_url || null;

    switch (method) {
      case 'all':
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}`;
        break;
      case 'qris':
        fee = amount > 105000 ? Math.round(0.01 * amount) : Math.round(0.007 * amount + 310);
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&qris_only=1`;
        break;
      case 'paypal':
        if (amount < 10000) throw new Error('Amount must be at least Rp10.000!');
        fee = Math.max(Math.round(0.01 * amount), 3000);
        payment_url = `${BASE_API_URL}/paypal/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}`;
        break;
      case 'cimb_niaga_va':
        fee = 3_500;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'bni_va':
        fee = 3_500;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'sampoerna_va':
        fee = 2_000;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'bnc_va':
        fee = 3_500;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'maybank_va':
        fee = 3_500;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'permata_va':
        fee = 3_500;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'atm_bersama_va':
        fee = 3_500;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'artha_graha_va':
        fee = 2_000;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      case 'bri_va':
        fee = 3_500;
        payment_url = `${BASE_API_URL}/pay/${slug}/${amount}?order_id=${order_id}&redirect=${redirect_url}&payment_method=${method}`;
        break;
      default:
        throw new Error('Invalid payment method! Only "all", "qris", and "paypal" are allowed!');
    }

    return {
      project: slug,
      order_id,
      amount,
      fee,
      status: 'pending',
      total_payment: amount + fee,
      payment_method: method,
      payment_number,
      payment_url,
      redirect_url,
      expired_at,
      completed_at: null,
    };
  }

  async createPayment(method: PaymentMethod, order_id: string, amount: number, redirect_url?: string): Promise<PaymentPayload> {
    order_id = sanitizeUrlSafe(order_id);

    const payload = this.getPaymentUrl(method, order_id, amount, redirect_url);

    const response = await fetch(`${BASE_API_URL}/api/transactioncreate/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: payload.project,
        api_key: this.config.apikey,
        order_id: payload.order_id,
        amount: payload.amount,
        redirect_url: payload.redirect_url,
      }),
    });

    const json = await response.json();

    if (!json?.data && !json?.payment) {
      throw new Error(json?.message || 'Failed to create payment!');
    }

    return {
      project: payload.project,
      order_id: payload.order_id,
      amount: payload.amount,
      fee: payload.fee,
      status: 'pending',
      total_payment: payload.total_payment,
      payment_method: method,
      payment_number: json.payment.payment_number,
      payment_url: payload.payment_url,
      redirect_url: payload.redirect_url,
      expired_at: json.payment.expired_at,
      completed_at: null,
    };
  }

  async detailPayment(order_id: string, amount: number): Promise<PaymentPayload> {
    order_id = sanitizeUrlSafe(order_id);

    const response = await fetch(
      `${BASE_API_URL}/api/transactiondetail?project=${this.config.slug}&amount=${amount}&order_id=${order_id}&api_key=${this.config.apikey}`,
    );

    const json = await response.json();

    if (!json?.data && !json?.transaction) {
      throw new Error(json?.message || 'Failed to get payment detail!');
    }

    const payload = this.getPaymentUrl(json.transaction.payment_method, order_id, amount);

    return {
      project: this.config.slug,
      order_id,
      amount,
      fee: payload.fee,
      status: json.transaction.status,
      total_payment: payload.total_payment,
      payment_method: payload.payment_method,
      payment_number: payload.payment_number,
      payment_url: payload.payment_url,
      redirect_url: payload.redirect_url,
      expired_at: null,
      completed_at: json.transaction.completed_at,
    };
  }

  async cancelPayment(order_id: string, amount: number): Promise<PaymentPayload> {
    order_id = sanitizeUrlSafe(order_id);

    const response = await fetch(`${BASE_API_URL}/api/transactioncancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: this.config.slug,
        api_key: this.config.apikey,
        order_id,
        amount,
      }),
    });

    const json = await response.json();

    if (!json?.data && !json?.success) {
      throw new Error(json?.message || 'Failed to cancel payment!');
    }

    const payload = await this.detailPayment(order_id, amount);

    payload.status = 'canceled';

    return payload;
  }

  async simulationPayment(order_id: string, amount: number): Promise<PaymentPayload> {
    order_id = sanitizeUrlSafe(order_id);

    const response = await fetch(`${BASE_API_URL}/api/paymentsimulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: this.config.slug,
        api_key: this.config.apikey,
        order_id,
        amount,
      }),
    });

    const json = await response.json();

    if (!json?.data && !json?.success) {
      throw new Error(json?.message || 'Failed to simulate payment!');
    }

    const payload = await this.detailPayment(order_id, amount);

    payload.status = 'completed';

    return payload;
  }

  watchPayment(order_id: string, amount: number, options: WatchOptions = {}): void {
    order_id = sanitizeUrlSafe(order_id);

    const interval = options.interval || 3000;
    const timeout = options.timeout || 600000;
    const watchKey = `${order_id}_${amount}`;

    this.stopWatch(order_id, amount);

    const timeoutId = setTimeout(() => {
      this.stopWatch(order_id, amount);
    }, timeout);

    this.watchTimeouts.set(watchKey, timeoutId);

    const checkStatus = async () => {
      try {
        const payment = await this.detailPayment(order_id, amount);
        const lastStatus = this.lastStatuses.get(watchKey);

        if (lastStatus !== payment.status) {
          if (options.onStatusChange) {
            options.onStatusChange(payment);
          }
        }

        this.lastStatuses.set(watchKey, payment.status);
      } catch (error) {
        if (options.onError) {
          options.onError(error as Error);
        }
      }
    };

    checkStatus();

    const intervalId = setInterval(checkStatus, interval);
    this.watchers.set(watchKey, intervalId);
  }

  stopWatch(order_id: string, amount: number): void {
    order_id = sanitizeUrlSafe(order_id);

    const watchKey = `${order_id}_${amount}`;

    const intervalId = this.watchers.get(watchKey);
    if (intervalId) {
      clearInterval(intervalId);
      this.watchers.delete(watchKey);
    }

    const timeoutId = this.watchTimeouts.get(watchKey);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.watchTimeouts.delete(watchKey);
    }

    this.lastStatuses.delete(watchKey);
  }
}
