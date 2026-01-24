import { NextRequest, NextResponse } from "next/server";

const env = (globalThis as any)?.process?.env || {};

function normalizeApiBase(u?: string) {
  const raw = (u || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

const API_BASE_URL =
  normalizeApiBase(env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL) ||
  "https://api.v1sofia.com/api";

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
      const url = new URL(req.url);
      url.searchParams.set("error", "missing_credentials");
      return NextResponse.redirect(url);
    }

    const url = `${API_BASE_URL}/partners/login`;
    const backendRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const json = await backendRes.json().catch(() => ({} as any));

    if (!backendRes.ok) {
      const status = backendRes.status;
      const url = new URL(req.url);
      if (status === 401) {
        url.searchParams.set("error", "invalid_credentials");
      } else if (status === 403) {
        url.searchParams.set("error", "forbidden_role");
      } else {
        url.searchParams.set("error", String((json as any)?.error || "login_failed"));
      }
      return NextResponse.redirect(url);
    }

    const token = String((json as any)?.token || "");
    if (!token) {
      const url = new URL(req.url);
      url.searchParams.set("error", "login_failed");
      return NextResponse.redirect(url);
    }

    const redirectUrl = new URL("/dashboard", req.url);
    const res = NextResponse.redirect(redirectUrl);

    const domain =
      env.NEXT_PUBLIC_COOKIE_DOMAIN ||
      env.COOKIE_DOMAIN ||
      "";

    const opts: any = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    };

    if (domain) opts.domain = domain;

    res.cookies.set("partner_auth", token, opts);

    return res;
  } catch {
    const url = new URL(req.url);
    url.searchParams.set("error", "internal_error");
    return NextResponse.redirect(url);
  }
}

