import { apiRequest } from "./http";
import type { Partner, PartnerBalance, PartnerSale, PartnerPayout, PartnerLink, PartnerCustomer, PartnerSaleDetail } from "../../types/partner";

export async function loginPartner(email: string, password: string): Promise<{ token: string; partner: Partner }> {
  return apiRequest<{ token: string; partner: Partner }>({
    path: "/partners/login",
    method: "POST",
    body: { email, password },
  });
}

export async function getPartnerMe(token: string): Promise<Partner> {
  return apiRequest<Partner>({ path: "/partners/me", token });
}

export async function getPartnerBalance(token: string): Promise<PartnerBalance> {
  return apiRequest<PartnerBalance>({ path: "/partners/me/balance", token });
}

export async function getPartnerSales(token: string, params?: Record<string, string>): Promise<{ items: PartnerSale[]; hasNextPage?: boolean; nextCursor?: string | null }> {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  return apiRequest<{ items: PartnerSale[]; hasNextPage?: boolean; nextCursor?: string | null }>({ path: `/partners/me/sales${q}`, token });
}

export async function getPartnerSaleById(token: string, id: string): Promise<PartnerSaleDetail> {
  return apiRequest<PartnerSaleDetail>({ path: `/partners/me/sales/${id}`, token });
}

export async function requestPayout(token: string, amount: number, method: string, pix_key?: string): Promise<PartnerPayout> {
  return apiRequest<PartnerPayout>({
    path: "/partners/me/payouts",
    method: "POST",
    token,
    body: { amount, method, pix_key },
  });
}

export async function getPartnerLinks(token: string): Promise<{ items: PartnerLink[] }> {
  return apiRequest<{ items: PartnerLink[] }>({ path: "/partners/me/links", token });
}

export async function getPartnerCustomers(token: string, params?: Record<string, string>): Promise<{ items: PartnerCustomer[] }> {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  return apiRequest<{ items: PartnerCustomer[] }>({ path: `/partners/me/customers${q}`, token });
}

export async function getPartnerPayouts(token: string): Promise<{ items: PartnerPayout[] }> {
  return apiRequest<{ items: PartnerPayout[] }>({ path: "/partners/me/payouts", token });
}
