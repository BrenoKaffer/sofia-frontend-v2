import { NextRequest, NextResponse } from "next/server";

const env = (globalThis as any)?.process?.env || {};

function normalizeApiBase(u?: string) {
  const raw = (u || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

const API_BASE_URL =
  normalizeApiBase(env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL) ||
  "https://api.v1sofia.com/api";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const url = `${API_BASE_URL}/partners/login`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const status = res.status;
      if (status === 401) {
        return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
      }
      if (status === 403) {
        return NextResponse.json({ error: "forbidden_role" }, { status: 403 });
      }
      return NextResponse.json({ error: json?.error || "login_failed" }, { status });
    }
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
