import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader (20-gorsel-kalite §6, SY-06; next.config.ts images.loaderFile). Stock photos
 * are served by their own CDN at the exact width the browser asks for: no copies in the repo and
 * no Vercel image quota (plan K-16). Panel uploads (D-28) get their own branch here.
 * Must stay a plain module without "use client": getImageProps runs on the server too.
 *
 * Unsplash URLs may carry a focal point (`fp-x`, `fp-y`) and a crop ratio (`ar`): they are kept.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    if (!url.searchParams.has("fit")) url.searchParams.set("fit", "max");
    return url.toString();
  }
  if (src.startsWith("https://images.pexels.com/")) {
    const url = new URL(src);
    url.searchParams.set("auto", "compress");
    url.searchParams.set("cs", "tinysrgb");
    url.searchParams.set("w", String(width));
    return url.toString();
  }
  return src;
}
