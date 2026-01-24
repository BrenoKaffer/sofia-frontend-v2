import { NextRequest, NextResponse } from "next/server";
import type { Partner } from "@/types/partner";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("partner_auth");
  const token = cookie?.value || "";
  if (!token) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const rawBase = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();
  const base = rawBase.replace(/\/+$/, "");
  const apiBase = base ? (base.endsWith("/api") ? base : `${base}/api`) : "https://api.v1sofia.com/api";

  const backendRes = await fetch(`${apiBase}/partners/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const json = (await backendRes.json().catch(() => ({}))) as any;
  if (!backendRes.ok) {
    const code = String(json?.error || "unauthorized");
    return NextResponse.json({ error: code }, { status: backendRes.status });
  }

  return NextResponse.json({ token, partner: json as Partner }, { status: 200 });
}
