import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const token = String((json as any)?.token || "");
    const remember = Boolean((json as any)?.remember);
    if (!token) {
      return NextResponse.json({ success: false, error: "token_missing" }, { status: 400 });
    }
    const res = NextResponse.json({ success: true });
    const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN || "";
    const opts: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    };
    if (domain) opts.domain = domain;
    res.cookies.set("partner_auth", token, opts);
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN || "";
  const opts: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
  if (domain) opts.domain = domain;
  res.cookies.set("partner_auth", "", opts);
  return res;
}
