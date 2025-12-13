export type PakasirConfig = {
  slug: string;
  apikey: string;
};

export type PaymentMethod =
  | 'all'
  | 'qris'
  | 'paypal'
  | 'cimb_niaga_va'
  | 'bni_va'
  | 'sampoerna_va'
  | 'bnc_va'
  | 'maybank_va'
  | 'permata_va'
  | 'atm_bersama_va'
  | 'artha_graha_va'
  | 'bri_va';

export type PaymentPayload = {
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
