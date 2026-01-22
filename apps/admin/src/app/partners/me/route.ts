import { NextRequest, NextResponse } from "next/server";
import type { Partner } from "@/types/partner";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== "test-token") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const partner: Partner = {
    id: "test-partner-id",
    user_id: "test-user-id",
    name: "Parceiro Teste",
    document: "00000000000",
    ref_code: "TESTCODE",
    commission_percentage: 0,
    payout_balance: 0,
  };
  return NextResponse.json(partner, { status: 200 });
}
