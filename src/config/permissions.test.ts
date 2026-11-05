import { describe, expect, it } from "vitest";

import {
  hasVenuePermission,
  isPlatformAdmin,
  secondStepRequired,
  VENUE_PERMISSIONS,
  type VenuePermission,
} from "./permissions";

describe("BR-YTK-001: role matrix (plan §8)", () => {
  const expected: Record<"owner" | "manager" | "staff", readonly VenuePermission[]> = {
    owner: VENUE_PERMISSIONS,
    manager: ["availability.edit", "content.edit", "prices.edit", "contexts.edit", "stats.view"],
    staff: ["availability.edit"],
  };

  for (const [role, allowed] of Object.entries(expected)) {
    it(`${role} holds exactly its permissions`, () => {
      const held = VENUE_PERMISSIONS.filter((permission) => hasVenuePermission(role, permission));
      expect(held).toEqual(allowed);
    });
  }

  it("an unknown or missing role holds nothing", () => {
    for (const role of [null, undefined, "", "admin", "OWNER"]) {
      expect(VENUE_PERMISSIONS.some((p) => hasVenuePermission(role, p))).toBe(false);
    }
  });

  it("only platform_role = admin is a platform admin", () => {
    expect(isPlatformAdmin("admin")).toBe(true);
    expect(isPlatformAdmin("owner")).toBe(false);
    expect(isPlatformAdmin(null)).toBe(false);
  });
});

describe("BR-YTK-002: second step on the live platform", () => {
  it("is required for a platform admin and a venue owner when live", () => {
    expect(secondStepRequired({ platformAdmin: true, ownsVenue: false }, true)).toBe(true);
    expect(secondStepRequired({ platformAdmin: false, ownsVenue: true }, true)).toBe(true);
  });

  it("is not required for managers and staff", () => {
    expect(secondStepRequired({ platformAdmin: false, ownsVenue: false }, true)).toBe(false);
  });

  it("is not required on the demo platform (shared demo accounts)", () => {
    expect(secondStepRequired({ platformAdmin: true, ownsVenue: true }, false)).toBe(false);
  });
});
