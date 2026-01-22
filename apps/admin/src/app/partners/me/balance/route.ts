import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== "test-token") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(
    { available: 0, pending: 0, total_sales: 0, total_commission: 0 },
    { status: 200 }
  );
}
