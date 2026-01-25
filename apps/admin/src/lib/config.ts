const env = (globalThis as any)?.process?.env || {};
function normalizeApiBase(u?: string) {
  const raw = (u || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

function isInvalidApiBase(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "pay.v1sofia.com") return true;
    if (host === "admin.v1sofia.com") return true;
    return false;
  } catch {
    return true;
  }
}

const apiBaseFromEnv = normalizeApiBase(env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL);
export const API_BASE_URL = apiBaseFromEnv && !isInvalidApiBase(apiBaseFromEnv) ? apiBaseFromEnv : "https://api.v1sofia.com/api";
export const APP_NAME = "SOFIA Admin – Portal do Parceiro";
export const CHECKOUT_BASE_URL =
  env.NEXT_PUBLIC_CHECKOUT_BASE_URL ||
  env.NEXT_PUBLIC_CHECKOUT_URL ||
  env.NEXT_PUBLIC_SALES_URL ||
  "";
