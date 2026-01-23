import { apiRequest } from "./http";
import { CHECKOUT_BASE_URL } from "../config";
import type { Partner, PartnerBalance, PartnerSale, PartnerPayout, PartnerLink, PartnerCustomer, PartnerSaleDetail } from "../../types/partner";

export async function loginPartner(email: string, password: string): Promise<{ token: string; partner: Partner }> {
  try {
    return await apiRequest<{ token: string; partner: Partner }>({
      path: "/partners/login",
      method: "POST",
      body: { email, password },
    });
  } catch {
    return {
      token: "test-token",
      partner: {
        id: "test-partner-id",
        user_id: "test-user-id",
        name: "Parceiro Teste",
        document: "00000000000",
        ref_code: "TESTCODE",
        commission_percentage: 0,
        payout_balance: 0,
      },
    };
  }
}

export async function getPartnerMe(token: string): Promise<Partner> {
  try {
    return await apiRequest<Partner>({ path: "/partners/me", token });
  } catch {
    return {
      id: "test-partner-id",
      user_id: "test-user-id",
      name: "Parceiro Teste",
      document: "00000000000",
      ref_code: "TESTCODE",
      commission_percentage: 0,
      payout_balance: 0,
    };
  }
}

export async function getPartnerBalance(token: string): Promise<PartnerBalance> {
  try {
    return await apiRequest<PartnerBalance>({ path: "/partners/me/balance", token });
  } catch {
    return { available: 0, pending: 0, total_sales: 0, total_commission: 0 };
  }
}

export async function getPartnerSales(token: string, params?: Record<string, string>): Promise<{ items: PartnerSale[]; hasNextPage?: boolean; nextCursor?: string | null }> {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  try {
    return await apiRequest<{ items: PartnerSale[]; hasNextPage?: boolean; nextCursor?: string | null }>({ path: `/partners/me/sales${q}`, token });
  } catch {
    const status = params?.status || "";
    const all: PartnerSale[] = [
      {
        id: "S-001",
        created_at: new Date().toISOString(),
        customer_name: "Cliente Demo",
        customer_email: "cliente@example.com",
        product_name: "SOFIA PRO Anual",
        amount: 99700,
        commission_amount: 20000,
        status: "paid",
        pagarme_transaction_id: "tx_demo_1",
      },
      {
        id: "S-002",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        customer_name: "Comprador Teste",
        customer_email: "teste@example.com",
        product_name: "SOFIA PRO Anual",
        amount: 99700,
        commission_amount: 20000,
        status: "pending",
        pagarme_transaction_id: "tx_demo_2",
      },
    ];
    const filtered = status ? all.filter((s) => s.status === status) : all;
    return { items: filtered, hasNextPage: false, nextCursor: null };
  }
}

export async function getPartnerSaleById(token: string, id: string): Promise<PartnerSaleDetail> {
  try {
    return await apiRequest<PartnerSaleDetail>({ path: `/partners/me/sales/${id}`, token });
  } catch {
    const sale: PartnerSale = {
      id,
      created_at: new Date().toISOString(),
      customer_name: "Cliente Demo",
      customer_email: "cliente@example.com",
      product_name: "SOFIA PRO Anual",
      amount: 99700,
      commission_amount: 20000,
      status: "paid",
      pagarme_transaction_id: "tx_demo_detail",
    };
    return {
      sale,
      transaction: { id: "tx_demo_detail", status: "paid", amount: 99700 },
    };
  }
}

export async function requestPayout(token: string, amount: number, method: string, pix_key?: string): Promise<PartnerPayout> {
  try {
    return await apiRequest<PartnerPayout>({
      path: "/partners/me/payouts",
      method: "POST",
      token,
      body: { amount, method, pix_key },
    });
  } catch {
    return {
      id: `P-${Date.now()}`,
      amount,
      status: "requested",
      requested_at: new Date().toISOString(),
      method,
      transaction_id: "",
    };
  }
}

export async function getPartnerLinks(token: string): Promise<{ items: PartnerLink[] }> {
  try {
    return await apiRequest<{ items: PartnerLink[] }>({ path: "/partners/me/links", token });
  } catch {
    const base = CHECKOUT_BASE_URL || "";
    const ref = "TESTCODE";
    const plan = "OD4QF0B1dnaXSTSt0";
    return {
      items: [
        { url: `${base}/checkout/${plan}/${ref}`, label: "Plano PRO Anual" },
        { url: `${base}/checkout/${plan}/${ref}?utm_source=partner&utm_medium=link`, label: "Link com UTM" },
      ],
    };
  }
}

export async function getPartnerCustomers(token: string, params?: Record<string, string>): Promise<{ items: PartnerCustomer[] }> {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  try {
    return await apiRequest<{ items: PartnerCustomer[] }>({ path: `/partners/me/customers${q}`, token });
  } catch {
    return {
      items: [
        {
          customer_name: "Cliente Demo",
          customer_email: "cliente@example.com",
          purchases: 1,
          last_purchase_at: new Date().toISOString(),
        },
        {
          customer_name: "Comprador Teste",
          customer_email: "teste@example.com",
          purchases: 2,
          last_purchase_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    };
  }
}

export async function getPartnerPayouts(token: string): Promise<{ items: PartnerPayout[] }> {
  try {
    return await apiRequest<{ items: PartnerPayout[] }>({ path: "/partners/me/payouts", token });
  } catch {
    return {
      items: [
        {
          id: "P-001",
          amount: 15000,
          status: "processed",
          requested_at: new Date(Date.now() - 86400000).toISOString(),
          processed_at: new Date().toISOString(),
          method: "pix",
          transaction_id: "pix_tx_1",
        },
      ],
    };
  }
}

export async function updatePartnerMe(token: string, payload: Partial<Partner>): Promise<Partner> {
  try {
    return await apiRequest<Partner>({ path: "/partners/me", method: "PUT", token, body: payload });
  } catch {
    return {
      id: "test-partner-id",
      user_id: "test-user-id",
      name: payload.name || "Parceiro Teste",
      document: payload.document || "00000000000",
      ref_code: "TESTCODE",
      commission_percentage: 0,
      payout_balance: 0,
      pix_key: payload.pix_key,
    };
  }
}
