import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/favicon.svg" || pathname === "/favicon.ico") {
    return NextResponse.next();
  }
  if (pathname === "/auth/sign-in" && req.method === "POST") {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/sign-in";
    return NextResponse.rewrite(url);
  }
  if (pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/auth") || pathname.startsWith("/api") || pathname.startsWith("/partners")) {
    return NextResponse.next();
  }
  const hasSession = req.cookies.get("partner_auth");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|images|favicon.ico|favicon.svg).*)"],
};
