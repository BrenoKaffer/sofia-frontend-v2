import { NextRequest, NextResponse } from "next/server";
import type { Partner } from "@/types/partner";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("partner_auth");
  const token = cookie?.value || "";
  if (!token) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }
  if (token !== "test-token") {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  const partner: Partner = {
    id: "test-partner-id",
    user_id: "test-user-id",
    name: "Parceiro Teste",
    document: "00000000000",
    ref_code: "TESTCODE",
    commission_percentage: 0,
    payout_balance: 0,
  };
  return NextResponse.json({ token, partner }, { status: 200 });
}
