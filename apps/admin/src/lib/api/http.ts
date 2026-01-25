import { API_BASE_URL } from "../config";

type RequestOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: any;
};

export async function apiRequest<T>(opts: RequestOptions): Promise<T> {
  const base = API_BASE_URL || "";
  const url = `${base}${opts.path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (json as any)?.error;
    const message =
      typeof err === "string"
        ? err
        : typeof err?.message === "string"
          ? err.message
          : err
            ? JSON.stringify(err)
            : res.statusText;
    throw new Error(message);
  }
  return json as T;
}
