import { notFound } from "next/navigation";

/**
 * Any other path on a venue's domain (D-11): the host rewrites send /{anything} to the default
 * language's tree, so the 404 renders inside the venue's own layout and language (not-found.tsx)
 * instead of the platform's global page. One placeholder path keeps Cache Components' rule that
 * generateStaticParams returns at least one entry. ensureStatic "navigation" makes an unlisted
 * path wait for its complete render instead of the empty fallback shell Next.js 16.3+ serves
 * otherwise, so the 404 arrives as HTML in the venue's language, with no JavaScript needed.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return [{ yol: ["-"] }];
}

export default async function VenueUnknownPath({
  params,
}: {
  params: Promise<{ yol: string[] }>;
}): Promise<never> {
  await params;
  notFound();
}
