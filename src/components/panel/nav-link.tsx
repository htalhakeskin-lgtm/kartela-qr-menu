"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A panel navigation link that marks the current page (aria-current). `exact` for the dashboard,
 * whose path is the prefix of every other venue page.
 */
export function NavLink({
  href,
  exact = false,
  className,
  children,
}: {
  href: string;
  exact?: boolean;
  className: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const current = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href as never} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
