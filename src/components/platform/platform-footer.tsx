import Link from "next/link";

import { SiteCredit } from "@/components/layout/site-credit";
import { platformDefaults } from "@/config/platform-defaults";
import { formatPhone } from "@/lib/format";

const LEGAL_LINKS = [
  { href: "/kvkk", label: "KVKK aydınlatma metni" },
  { href: "/gizlilik", label: "Gizlilik politikası" },
  { href: "/cerez-politikasi", label: "Çerez politikası" },
] as const;

/** Platform footer (Z-12): legal links, contact, demo note and — last row — the maker's credit. */
export function PlatformFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_auto] md:px-8">
        <div>
          <p className="text-lg font-semibold">{platformDefaults.name}</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{platformDefaults.tagline}</p>
          <p className="mt-4 text-sm">
            <a
              href={`tel:${platformDefaults.contact.phone}`}
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              {formatPhone(platformDefaults.contact.phone)}
            </a>
          </p>
        </div>
        <nav aria-label="Yasal">
          <ul className="flex flex-col gap-1 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-border px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p className="text-muted-foreground">
          Bu site gösterim amaçlı bir demodur; platform, mekânlar, kişiler ve fiyatlar kurgusaldır.
        </p>
        <SiteCredit className="shrink-0 text-xs tracking-[0.08em] text-muted-foreground" />
      </div>
    </footer>
  );
}
