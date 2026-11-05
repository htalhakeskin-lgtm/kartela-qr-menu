import type { VenueRole } from "./permissions";

/**
 * Demo panel accounts (plan §19, 11-guvenlik §4 "Demo"): one per role, so a visitor of the demo
 * sees what each role sees. Seeded only while PLATFORM_DEMO=true, all with DEMO_ADMIN_PASSWORD;
 * the login page signs in with one tap and never shows the password. The platform admin's address
 * is DEMO_ADMIN_EMAIL. Fictional people, addresses on example.com (RFC 2606).
 *
 * A demo account cannot change its password or its second step (a shared account would lock the
 * next visitor out).
 */
export type DemoVenueAccount = {
  key: string;
  label: string;
  name: string;
  email: string;
  venue: string;
  role: VenueRole;
};

export const DEMO_PLATFORM_ACCOUNT = {
  key: "platform",
  label: "Platform yöneticisi",
  name: "Demo Platform Yöneticisi",
} as const;

export const DEMO_VENUE_ACCOUNTS: readonly DemoVenueAccount[] = [
  {
    key: "rakim-sahip",
    label: "Rakım · sahip",
    name: "Selin Arslan",
    email: "sahip@rakim.example.com",
    venue: "rakim",
    role: "owner",
  },
  {
    key: "rakim-yonetici",
    label: "Rakım · yönetici",
    name: "Kerem Yıldız",
    email: "yonetici@rakim.example.com",
    venue: "rakim",
    role: "manager",
  },
  {
    key: "rakim-personel",
    label: "Rakım · personel",
    name: "Ada Demir",
    email: "personel@rakim.example.com",
    venue: "rakim",
    role: "staff",
  },
];
