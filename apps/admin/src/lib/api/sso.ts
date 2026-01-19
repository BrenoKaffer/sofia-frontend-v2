import { API_BASE_URL } from "../config";
import type { Partner } from "../../types/partner";

export async function ssoExchange(): Promise<{ token: string; partner: Partner } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/partners/sso`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    if (!json?.token) return null;
    return json as { token: string; partner: Partner };
  } catch {
    return null;
  }
}
