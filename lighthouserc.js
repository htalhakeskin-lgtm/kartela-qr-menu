// Lighthouse CI (12-performans §8, PF-05). After `pnpm build`: `pnpm lighthouse`.
// Mobile profile (Lighthouse default). Accessibility and best practices fail below 0.95.
// Venue menu pages (venue hosts, *.localhost), ADR-0006 / plan K-40: performance below 0.90 fails
// and below 0.95 warns; the hard gate is the first paint: FCP ≤ 1.5 s fails above (the first
// product's name and price are in the server HTML, tests/e2e/site.spec.ts). Platform pages warn
// below 0.90. Demo sites are noindex, so the SEO category is replaced by the
// individual SEO audits. Chrome: CI runners have it; locally set CHROME_PATH if not found.

const demo = process.env.PLATFORM_DEMO !== "false";
// LHCI_PORT: a free port when 3020 is taken locally (CI uses 3020).
const port = process.env.LHCI_PORT ?? "3020";
const base = `http://localhost:${port}`;

// Platform home + legal text template + the Rakım quick menu on its own host (ADR-0002 v2;
// Chrome resolves *.localhost). D-22 turns this into the venue matrix: every venue's quick menu,
// Keşfet and an item page.
const urls = [`${base}/`, `${base}/kvkk`, `http://rakim.localhost:${port}/`];

// Category scores are judged on the median run of the three ("median-run"); the default would
// take the best run, which hid a 0.93 performance run behind a 0.99 one (D-01 CI).
const median = { aggregationMethod: "median-run" };

const shared = {
  "categories:accessibility": ["error", { minScore: 0.95, ...median }],
  "categories:best-practices": ["error", { minScore: 0.95, ...median }],
  "categories:seo": demo ? "off" : ["error", { minScore: 1 }],
  ...(demo
    ? {
        "document-title": "error",
        "meta-description": "error",
        "http-status-code": "error",
        "crawlable-anchors": "error",
        canonical: "error",
        hreflang: "error",
        "link-text": "warn",
      }
    : {}),
};

module.exports = {
  ci: {
    collect: {
      startServerCommand: `node node_modules/next/dist/bin/next start -p ${port}`,
      startServerReadyPattern: "Ready in",
      url: urls,
      numberOfRuns: 3, // median of three: the performance score moves between runs
      settings: { chromeFlags: "--no-sandbox --headless=new" },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: "^https?://[a-z0-9-]+\\.localhost[:/].*",
          assertions: {
            ...shared,
            "categories:performance": ["error", { minScore: 0.9, ...median }],
            "first-contentful-paint": ["error", { maxNumericValue: 1500, ...median }],
          },
        },
        {
          // Same venue pages: the 0.95 target stays visible as a warning (ADR-0006).
          matchingUrlPattern: "^https?://[a-z0-9-]+\\.localhost[:/].*",
          assertions: { "categories:performance": ["warn", { minScore: 0.95, ...median }] },
        },
        {
          matchingUrlPattern: "^https?://(localhost|127\\.0\\.0\\.1)[:/].*",
          assertions: {
            ...shared,
            "categories:performance": ["warn", { minScore: 0.9, ...median }],
          },
        },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
