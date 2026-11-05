import Link from "next/link";
import type { ReactNode } from "react";

import { SiteCredit } from "@/components/layout/site-credit";

/**
 * The frame of the sign-in pages (SCR-100, SCR-101): Kartela's name, one narrow column, the legal
 * link for panel users (plan §14: KVKK aydınlatma under /panel/giris) and the maker's credit.
 */
export function AuthFrame({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-4 pt-6 md:px-8 md:pt-8">
        <Link href="/" className="inline-flex min-h-11 items-center text-lg font-semibold">
          Kartela
        </Link>
      </header>
      <main id="icerik" className="flex flex-1 items-start justify-center px-4 py-8 md:py-16">
        <div className="w-full max-w-[26rem]">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{lead}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 border-t border-border px-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
        <Link
          href="/kvkk"
          className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 hover:underline"
        >
          Panel kullanıcıları için KVKK aydınlatma metni
        </Link>
        <SiteCredit className="text-xs tracking-[0.08em] text-muted-foreground" />
      </footer>
    </div>
  );
}
