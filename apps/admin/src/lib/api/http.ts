import { API_BASE_URL } from "../config";

type RequestOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: any;
};

export async function apiRequest<T>(opts: RequestOptions): Promise<T> {
  const url = `${API_BASE_URL}${opts.path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String((json as any)?.error || res.statusText));
  return json as T;
}
