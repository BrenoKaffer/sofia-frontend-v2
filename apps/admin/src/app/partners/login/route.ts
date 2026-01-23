import { NextRequest, NextResponse } from "next/server";
import type { Partner } from "@/types/partner";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const expectedEmail = String(process.env.TEST_EMAIL || "admin@sofia.com").trim().toLowerCase();
    const expectedPassword = String(process.env.TEST_PASSWORD || "123456");
    const isValid =
      typeof email === "string" &&
      typeof password === "string" &&
      email.trim().toLowerCase() === expectedEmail &&
      password === expectedPassword;
    if (!isValid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const partner: Partner = {
      id: "test-partner-id",
      user_id: "test-user-id",
      name: "Parceiro Teste",
      document: "00000000000",
      ref_code: "TESTCODE",
      commission_percentage: 0,
      payout_balance: 0,
    };
    return NextResponse.json({ token: "test-token", partner }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
