import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { venueHostNames, venues } from "@/platform/tenant/registry";

/**
 * Next.js 16 proxy (formerly middleware), for the panel only. Tenant routing does NOT live here:
 * the proxy runs on the Node.js runtime, so matching every menu request would invoke a function
 * before the CDN; venue hosts are routed by host-based rewrites in next.config.ts instead
 * (ADR-0002 v2, plan K-39).
 *
 * 0. A venue host has no panel (plan §8: no session cookie on venue domains): the request passes
 *    on untouched and the host's rewrites answer with the venue's own 404.
 * 1. Optimistic panel guard: no session cookie → sign-in page. The real check (session +
 *    permission) happens on the server in every panel page and action. The sign-in pages
 *    (/panel/giris, its second step) stay open.
 * 2. Strict nonce-based CSP for the panel, which is dynamic anyway (11-guvenlik §8, GV-03).
 *    Public pages get a static CSP from next.config.ts.
 */
const LOGIN_PATH = "/panel/giris";
const VENUE_HOSTS = new Set(venues.flatMap(venueHostNames));

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").replace(/:\d+$/, "").toLowerCase();
  if (VENUE_HOSTS.has(host)) return NextResponse.next();

  const open = pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  if (!open && !getSessionCookie(request, { cookiePrefix: "kartela" })) {
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set("donus", `${pathname}${search}`); // relative path only (11-guvenlik §7)
    return NextResponse.redirect(login);
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
  response.headers.set("Cache-Control", "private, no-store"); // REQ-017: the panel is never cached
  return response;
}

// Must be static literals: Next.js reads the matcher at build time.
export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
