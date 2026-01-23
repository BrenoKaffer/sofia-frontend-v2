export type Partner = {
  id: string;
  user_id: string;
  name: string;
  document?: string;
  pix_key?: string;
  ref_code: string;
  commission_percentage: number;
  payout_balance: number;
};

export type PartnerBalance = {
  available: number;
  pending: number;
  total_sales: number;
  total_commission: number;
};

export type PartnerSale = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  amount: number;
  commission_amount: number;
  status: string;
  pagarme_transaction_id?: string;
};

export type PartnerSaleDetail = {
  sale: PartnerSale;
  transaction?: any | null;
};

export type PartnerPayout = {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  processed_at?: string;
  method?: string;
  transaction_id?: string;
};

export type PartnerLink = {
  url: string;
  label?: string;
};

export type PartnerCustomer = {
  customer_name: string;
  customer_email: string;
  purchases: number;
  last_purchase_at: string;
};
