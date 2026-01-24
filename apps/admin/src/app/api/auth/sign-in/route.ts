import { NextRequest, NextResponse } from "next/server";

function normalizeApiBase(u?: string) {
  const raw = (u || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

const API_BASE_URL =
  normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL) ||
  "https://api.v1sofia.com/api";

function wantsJson(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  const contentType = req.headers.get("content-type") || "";
  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let email = "";
    let password = "";
    let remember = false;

    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as any;
      email = String(body?.email || "").trim().toLowerCase();
      password = String(body?.password || "");
      remember = Boolean(body?.remember);
    } else {
      const form = await req.formData().catch(() => null);
      if (form) {
        email = String(form.get("email") || "").trim().toLowerCase();
        password = String(form.get("password") || "");
        const r = form.get("remember");
        remember = r === "on" || r === "true" || r === "1";
      }
    }

    if (!email || !password) {
      if (wantsJson(req)) {
        return NextResponse.json({ success: false, error: "missing_credentials" }, { status: 400 });
      }
      const url = new URL("/auth/sign-in", req.url);
      url.searchParams.set("error", "missing_credentials");
      return NextResponse.redirect(url, 303);
    }

    const backendRes = await fetch(`${API_BASE_URL}/partners/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const json = (await backendRes.json().catch(() => ({}))) as any;

    if (!backendRes.ok) {
      const status = backendRes.status;
      const code =
        status === 401
          ? "invalid_credentials"
          : status === 403
            ? "forbidden_role"
            : String(json?.error || "login_failed");

      if (wantsJson(req)) {
        return NextResponse.json({ success: false, error: code, details: json }, { status });
      }

      const url = new URL("/auth/sign-in", req.url);
      url.searchParams.set("error", code);
      return NextResponse.redirect(url, 303);
    }

    const token = String(json?.token || "");
    if (!token) {
      if (wantsJson(req)) {
        return NextResponse.json({ success: false, error: "login_failed", details: json }, { status: 502 });
      }
      const url = new URL("/auth/sign-in", req.url);
      url.searchParams.set("error", "login_failed");
      return NextResponse.redirect(url, 303);
    }

    const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN || "";
    const cookieOpts: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    };
    if (domain) cookieOpts.domain = domain;

    if (wantsJson(req)) {
      const res = NextResponse.json({ success: true, token, partner: json?.partner ?? null }, { status: 200 });
      res.cookies.set("partner_auth", token, cookieOpts);
      return res;
    }

    const redirectUrl = new URL("/dashboard", req.url);
    const res = NextResponse.redirect(redirectUrl, 303);
    res.cookies.set("partner_auth", token, cookieOpts);
    return res;
  } catch {
    if (wantsJson(req)) {
      return NextResponse.json({ success: false, error: "internal_error" }, { status: 500 });
    }
    const url = new URL("/auth/sign-in", req.url);
    url.searchParams.set("error", "internal_error");
    return NextResponse.redirect(url, 303);
  }
}
