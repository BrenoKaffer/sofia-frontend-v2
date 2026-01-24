import { NextRequest, NextResponse } from "next/server";
import type { Partner } from "@/types/partner";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
    return NextResponse.json({ error: json?.error || "unauthorized" }, { status: backendRes.status });
  }
  return NextResponse.json(json as Partner, { status: 200 });
}
