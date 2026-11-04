"use client";

/**
 * Last-resort error page when a root layout itself fails (Z-11). It replaces the whole document,
 * so it carries its own minimal styles; route-level errors use each tree's error.tsx.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f7f5",
          color: "#18181b",
        }}
      >
        <main style={{ maxWidth: "32rem", padding: "2rem 1rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Bir sorun oluştu</h1>
          <p style={{ lineHeight: 1.6, color: "#5b5b63" }}>
            Sayfa yüklenemedi. Birkaç saniye sonra yeniden deneyin.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 44,
              padding: "0 1.25rem",
              border: 0,
              borderRadius: 6,
              background: "#1f5f4a",
              color: "#f7f7f5",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Yeniden dene
          </button>
        </main>
      </body>
    </html>
  );
}
