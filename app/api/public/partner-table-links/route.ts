import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOFIA_BACKEND_URL = process.env.SOFIA_BACKEND_URL || "http://localhost:3001/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const affiliateSlug = String(searchParams.get("affiliate_slug") || "").trim();
  const tableId = String(searchParams.get("table_id") || "").trim();

  if (!affiliateSlug || !tableId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const url = `${SOFIA_BACKEND_URL}/partners/public/${encodeURIComponent(affiliateSlug)}/table-links?${new URLSearchParams({
    table_id: tableId,
  }).toString()}`;

  const backendRes = await fetch(url, { method: "GET", cache: "no-store" });
  const json = await backendRes.json().catch(() => ({}));

  if (!backendRes.ok) {
    return NextResponse.json({ error: (json as any)?.error || "internal_error" }, { status: backendRes.status });
  }

  return NextResponse.json(json, { status: 200 });
}

