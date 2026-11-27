/**
 * The panel's few line icons (24 px grid, 1.75 stroke, currentColor). Decorative: the link or
 * button beside them carries the name.
 */
const PATHS = {
  pano: "M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-4H4v4Zm10-13h6V4h-6v3Z",
  mekanlar: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
  hesap: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0",
  daha: "M4 6h16M4 12h16M4 18h16",
  cikis: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  dis: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  kapat: "M6 6l12 12M18 6 6 18",
  musaitlik: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-9 2.5 2.5 4.5-5",
  gunun: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  ayarlar: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  ekip: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M21 20a6 6 0 0 0-4-5.6",
  gecmis: "M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4",
} as const;

export type PanelIconName = keyof typeof PATHS;

export function PanelIcon({
  name,
  className = "size-5",
}: {
  name: PanelIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
