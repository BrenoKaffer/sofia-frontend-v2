const env = (globalThis as any)?.process?.env || {};
function normalizeApiBase(u?: string) {
  const raw = (u || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}
export const API_BASE_URL = normalizeApiBase(env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL);
export const APP_NAME = "SOFIA Admin – Portal do Parceiro";
export const CHECKOUT_BASE_URL =
  env.NEXT_PUBLIC_CHECKOUT_BASE_URL ||
  env.NEXT_PUBLIC_CHECKOUT_URL ||
  env.NEXT_PUBLIC_SALES_URL ||
  "";
