import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/(panel)/panel/giris/actions";
import { ROLE_LABELS } from "@/config/permissions";
import type { PanelVenue } from "@/server/db/tenant";
import type { PanelUser } from "@/server/panel/session";

import { PanelIcon, type PanelIconName } from "./icons";
import { MORE_SHEET_ID, MoreSheet } from "./more-sheet";
import { type PanelNavGroup, venueNav } from "./nav";
import { NavLink } from "./nav-link";

/**
 * The panel shell (13-yonetim-paneli §3, plan §12 "Mobil"): on wide screens a side menu, grouped;
 * on a phone a top bar and a tab bar in the thumb zone, with "Daha fazla" opening every page in a
 * sheet. Server component: only the active-link marker and the sheet's close-on-navigate are
 * client code.
 */
type ShellProps = {
  user: PanelUser;
  /** The venue being worked on; null on the venue picker and the account page. */
  venue: PanelVenue | null;
  venues: readonly PanelVenue[];
  children: ReactNode;
};

const SIDE_LINK =
  "flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-muted-foreground hover:bg-surface-muted hover:text-foreground aria-[current=page]:bg-surface-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground";
const SHEET_LINK =
  "flex min-h-12 items-center gap-3 rounded-md px-2 text-base aria-[current=page]:font-semibold";
const TAB =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground aria-[current=page]:font-semibold aria-[current=page]:text-primary";

function ModeBadge({ mode }: { mode: PanelVenue["mode"] }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
      {mode === "live" ? "Canlı" : "Demo"}
    </span>
  );
}

function siteHref(venue: PanelVenue): string {
  // The path-prefixed preview of the same deployment (ADR-0002): right on every environment.
  return `/m/${venue.slug}/`;
}

function NavGroups({ groups, linkClass }: { groups: readonly PanelNavGroup[]; linkClass: string }) {
  return groups.map((group) => (
    <div key={group.label} className="mt-6 first:mt-0">
      <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {group.label}
      </p>
      <ul className="mt-2 flex flex-col gap-0.5">
        {group.items.map((item) => (
          <li key={item.path}>
            <NavLink href={item.path} exact={item.exact} className={linkClass}>
              <PanelIcon name={item.icon} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  ));
}

function SignOut({ className }: { className: string }) {
  return (
    <form action={signOutAction}>
      <button type="submit" className={className}>
        <PanelIcon name="cikis" />
        Çıkış yap
      </button>
    </form>
  );
}

function AccountLinks({ user, linkClass }: { user: PanelUser; linkClass: string }) {
  return (
    <>
      <p className="px-3 text-sm font-medium">{user.name}</p>
      <p className="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
      <ul className="mt-2 flex flex-col gap-0.5">
        <li>
          <NavLink href="/panel/hesap" className={linkClass}>
            <PanelIcon name="hesap" />
            Hesabım
          </NavLink>
        </li>
        <li>
          <SignOut className={`${linkClass} w-full`} />
        </li>
      </ul>
    </>
  );
}

function VenueBlock({
  venue,
  venues,
}: {
  venue: PanelVenue | null;
  venues: readonly PanelVenue[];
}) {
  if (!venue) {
    return venues.length > 0 ? (
      <NavLink href="/panel" exact className={SIDE_LINK}>
        <PanelIcon name="mekanlar" />
        Mekânlar
      </NavLink>
    ) : null;
  }
  return (
    <div className="px-3">
      <p className="leading-snug font-semibold">{venue.name}</p>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        {ROLE_LABELS[venue.role]}
        <ModeBadge mode={venue.mode} />
      </p>
      {venues.length > 1 ? (
        <Link
          href="/panel"
          className="mt-1 inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
        >
          Mekân değiştir
        </Link>
      ) : null}
    </div>
  );
}

function TabLink({
  href,
  icon,
  label,
  exact,
}: {
  href: string;
  icon: PanelIconName;
  label: string;
  exact?: boolean;
}) {
  return (
    <NavLink href={href} exact={exact} className={TAB}>
      <PanelIcon name={icon} />
      {label}
    </NavLink>
  );
}

export function PanelShell({ user, venue, venues, children }: ShellProps) {
  const groups = venue ? venueNav(venue.slug, venue.role) : [];
  const tabs = groups
    .flatMap((group) => group.items)
    .filter((item) => item.tab)
    .slice(0, 3);

  return (
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-border bg-surface px-3 py-5 lg:flex">
        <Link href="/panel" className="flex min-h-11 items-center gap-2 px-3 font-semibold">
          Kartela
          <span className="text-sm font-normal text-muted-foreground">panel</span>
        </Link>
        <div className="mt-6">
          <VenueBlock venue={venue} venues={venues} />
        </div>
        <nav aria-label="Panel" className="mt-6 flex-1">
          <NavGroups groups={groups} linkClass={SIDE_LINK} />
        </nav>
        <div className="border-t border-border pt-4">
          <AccountLinks user={user} linkClass={SIDE_LINK} />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header
          className={`flex min-h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:justify-end lg:px-8 ${venue ? "" : "lg:hidden"}`}
        >
          <p className="min-w-0 truncate font-semibold lg:hidden">
            {venue ? venue.name : "Kartela panel"}
          </p>
          {venue ? (
            <a
              href={siteHref(venue)}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md px-2 text-sm hover:bg-surface-muted"
            >
              <PanelIcon name="dis" className="size-4" />
              <span className="sr-only sm:not-sr-only">Siteyi görüntüle</span>
              <span className="sr-only">(yeni sekmede açılır)</span>
            </a>
          ) : null}
        </header>
        <main id="icerik" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Panel sekmeleri"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabs.map((item) => (
          <TabLink
            key={item.path}
            href={item.path}
            icon={item.icon}
            label={item.label}
            exact={item.exact}
          />
        ))}
        {venue ? null : <TabLink href="/panel" icon="mekanlar" label="Mekânlar" exact />}
        <TabLink href="/panel/hesap" icon="hesap" label="Hesabım" />
        <button type="button" popoverTarget={MORE_SHEET_ID} className={TAB}>
          <PanelIcon name="daha" />
          Daha fazla
        </button>
      </nav>

      <MoreSheet>
        <div className="flex items-center justify-between">
          <p className="font-semibold">{venue ? venue.name : "Kartela panel"}</p>
          <button
            type="button"
            popoverTarget={MORE_SHEET_ID}
            popoverTargetAction="hide"
            aria-label="Kapat"
            className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-muted"
          >
            <PanelIcon name="kapat" />
          </button>
        </div>
        {venue && venues.length > 1 ? (
          <Link href="/panel" className={`${SHEET_LINK} mt-2`}>
            <PanelIcon name="mekanlar" />
            Mekân değiştir
          </Link>
        ) : null}
        <nav aria-label="Panel (tümü)" className="mt-4">
          <NavGroups groups={groups} linkClass={SHEET_LINK} />
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <AccountLinks user={user} linkClass={SHEET_LINK} />
        </div>
      </MoreSheet>
    </div>
  );
}
