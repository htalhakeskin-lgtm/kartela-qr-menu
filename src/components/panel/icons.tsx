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
