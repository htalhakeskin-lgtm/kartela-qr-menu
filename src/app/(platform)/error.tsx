"use client";

/** Error state of the platform pages (Z-11, 06 §7): what happened and what to do next. */
export default function PlatformError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Bir sorun oluştu</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Sayfa şu anda yüklenemedi. Birkaç saniye sonra yeniden deneyin.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground"
      >
        Yeniden dene
      </button>
    </main>
  );
}
