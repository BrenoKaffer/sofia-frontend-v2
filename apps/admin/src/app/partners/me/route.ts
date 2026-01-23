import { NextRequest, NextResponse } from "next/server";
import type { Partner } from "@/types/partner";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (token === "test-token-breno") {
    const partner: Partner = {
      id: "b88e6523-b83f-4d51-815e-238d6ccc9710",
      user_id: "8dac172d-19eb-4382-b3ad-14650ec30c85",
      name: "Breno Kaique Ferreira Silva Santos",
      document: "000.000.000-00",
      ref_code: "BRENO07",
      commission_percentage: 10,
      payout_balance: 0,
    };
    return NextResponse.json(partner, { status: 200 });
  }

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
