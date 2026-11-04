// Conventional Commits in English (15-git-ve-ci §3).
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "perf", "refactor", "test", "docs", "build", "ci", "chore", "revert"],
    ],
    // Feature module names. Warning level: add new modules here when the feature is created.
    "scope-enum": [
      1,
      "always",
      [
        "leads",
        "panel",
        "auth",
        "db",
        "ui",
        "seo",
        "legal",
        "content",
        "deps",
        "deps-dev",
        "release",
      ],
    ],
    "header-max-length": [2, "always", 72],
  },
  // Dependabot titles ("Bump x from 1 to 2") cannot be configured; the squash title is fixed by hand.
  ignores: [(message) => /^Bump .+ from .+ to .+/.test(message)],
};

export default config;
