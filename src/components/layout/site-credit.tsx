/**
 * The maker's credit in the footer's last row, opposite the demo note (17 §3 IC-07, 06 AR-08).
 * Set like the site's small labels: adapt the classes to the concept's label style (plan §11),
 * keep the wording. "Created by" is English: `lang="en"` for screen readers.
 */
export function SiteCredit({ className }: { className?: string }) {
  return (
    <p className={className ?? "shrink-0 font-mono text-xs tracking-[0.1em] text-muted-foreground"}>
      <span lang="en">Created by</span> <span className="text-foreground">Talha Keskin</span>
    </p>
  );
}
