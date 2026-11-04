import { describe, expect, it } from "vitest";

import { dbFingerprint, migrationRefusal } from "./preview-db-guard.mjs";

/** K-42: a preview build never migrates or seeds the production database. */
describe("preview database guard", () => {
  const production = dbFingerprint("postgres://u:p@ep-main-111.eu-central-1.aws.neon.tech/db");
  const branch = dbFingerprint("postgres://u:p@ep-branch-222.eu-central-1.aws.neon.tech/db");
  const preview = { target: "preview", previewDbBranch: "true", productionFingerprint: production };

  it("fingerprints the compute endpoint: pooled and direct URLs agree, credentials do not matter", () => {
    expect(dbFingerprint("postgres://a:b@ep-main-111-pooler.eu-central-1.aws.neon.tech/db")).toBe(
      production,
    );
    expect(dbFingerprint("postgres://other:secret@ep-main-111.eu-central-1.aws.neon.tech/x")).toBe(
      production,
    );
    expect(production).toMatch(/^[0-9a-f]{12}$/);
    expect(branch).not.toBe(production);
  });

  it("production always migrates; a local build never does", () => {
    expect(migrationRefusal({ target: "production", fingerprint: production })).toBeNull();
    expect(migrationRefusal({ target: "local", fingerprint: branch })).toBe(
      "not a Vercel deployment",
    );
  });

  it("a preview migrates only on its own branch with both switches set", () => {
    expect(migrationRefusal({ ...preview, fingerprint: branch })).toBeNull();
    expect(migrationRefusal({ ...preview, fingerprint: production })).toBe(
      "this preview uses the production database",
    );
    expect(migrationRefusal({ ...preview, fingerprint: branch, previewDbBranch: undefined })).toBe(
      "PREVIEW_DB_BRANCH is not true",
    );
    expect(
      migrationRefusal({ ...preview, fingerprint: branch, productionFingerprint: undefined }),
    ).toBe("PRODUCTION_DB_FINGERPRINT is not set");
    expect(migrationRefusal({ ...preview, fingerprint: "none" })).toBe("no database URL");
  });
});
