import { NextRequest, NextResponse } from "next/server";
import type { Partner } from "@/types/partner";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // 1. Mock Padrão (Ambiente de Desenvolvimento)
    const expectedEmail = String(process.env.TEST_EMAIL || "admin@sofia.com").trim().toLowerCase();
    const expectedPassword = String(process.env.TEST_PASSWORD || "123456");
    
    // 2. Mock Usuário Real (Simulação de Produção)
    const prodEmail = "b.kaffer07@gmail.com";
    // Aceita a senha padrão ou qualquer senha para este usuário em dev
    const isProdUser = email.trim().toLowerCase() === prodEmail;

    const isValid =
      (email.trim().toLowerCase() === expectedEmail && password === expectedPassword) ||
      isProdUser;

    if (!isValid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let partner: Partner;
    let token = "test-token";

    if (isProdUser) {
      token = "test-token-breno";
      partner = {
        id: "b88e6523-b83f-4d51-815e-238d6ccc9710",
        user_id: "8dac172d-19eb-4382-b3ad-14650ec30c85",
        name: "Breno Kaique Ferreira Silva Santos",
        document: "000.000.000-00", // CPF não fornecido no SQL, usando placeholder
        ref_code: "BRENO07",
        commission_percentage: 10,
        payout_balance: 0,
      };
    } else {
      partner = {
        id: "test-partner-id",
        user_id: "test-user-id",
        name: "Parceiro Teste",
        document: "00000000000",
        ref_code: "TESTCODE",
        commission_percentage: 0,
        payout_balance: 0,
      };
    }

    return NextResponse.json({ token, partner }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
