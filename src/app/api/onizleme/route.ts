import { connection, type NextRequest, NextResponse } from "next/server";

import { getVenue } from "@/platform/tenant/registry";
import { PREVIEW_COOKIE } from "@/platform/tenant/rewrites";

const LEAVE_PREVIEW = "platform";

/**
 * Preview venue switch (ADR-0002 v2, step 4). Reached through a rewrite: `/{yol}?mekan={slug}` on
 * the platform or a preview host. A known slug sets the session cookie that the cookie rewrites
 * read; `?mekan=platform` clears it (an empty value counts as "no parameter" in Next.js rewrites). Then it redirects to the same path without `mekan`, so later
 * client navigations keep the venue. Routing infrastructure, no personal data: no rate limit.
 */
export async function GET(request: NextRequest) {
  await connection();
  const params = request.nextUrl.searchParams;
  const requested = params.get("mekan") ?? "";
  const slug = requested === LEAVE_PREVIEW ? "" : requested;
  // Back to the page that carried ?mekan=. A rewritten request reaches this handler with its
  // ORIGINAL URL (/kvkk?mekan=…), so that path wins; `yol` covers a direct call. Relative path
  // only, never an open redirect (11-guvenlik §7).
  const original = request.nextUrl.pathname;
  const raw = original.startsWith("/api/onizleme") ? (params.get("yol") ?? "") : original;
  const path = `/${raw.replace(/^\/+/, "")}`.replace(/\/{2,}/g, "/");
  const target = new URL(path.startsWith("//") ? "/" : path, request.nextUrl.origin);

  const venue = slug ? getVenue(slug) : undefined;
  if (slug && !venue) {
    return NextResponse.json({ error: "Bilinmeyen mekân" }, { status: 404 });
  }

  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "no-store");
  if (venue) {
    response.cookies.set(PREVIEW_COOKIE, venue.slug, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  } else {
    response.cookies.delete(PREVIEW_COOKIE);
  }
  return response;
}
