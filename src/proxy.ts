import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy (formerly middleware), for the panel only. Tenant routing does NOT live here:
 * the proxy runs on the Node.js runtime, so matching every menu request would invoke a function
 * before the CDN; venue hosts are routed by host-based rewrites in next.config.ts instead
 * (ADR-0002 v2, plan K-39).
 *
 * 1. Optimistic panel guard: no session cookie → login page. The real check (session +
 *    permission) happens on the server in every panel layout and action.
 * 2. Strict nonce-based CSP for the panel, which is dynamic anyway (11-guvenlik §8, GV-03).
 *    Public pages get a static CSP from next.config.ts.
 */
const LOGIN_PATH = "/panel/giris";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname !== LOGIN_PATH) {
    if (!getSessionCookie(request, { cookiePrefix: "kartela" })) {
      const login = new URL(LOGIN_PATH, request.url);
      login.searchParams.set("donus", `${pathname}${search}`); // relative path only (11-guvenlik §7)
      return NextResponse.redirect(login);
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development"; // eslint-disable-line no-restricted-properties -- build-time constant
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp); // Next.js reads the nonce from here

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

// Must be static literals: Next.js reads the matcher at build time.
export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
