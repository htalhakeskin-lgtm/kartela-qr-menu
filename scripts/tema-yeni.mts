/**
 * pnpm tema:yeni — a new theme that starts as a copy of Sade (D-21, ADR-0003): the theme module
 * (src/themes/{id}/) and its route tree (src/app/tema-{id}/), with Sade's names replaced, the id
 * added to THEMES and to the ESLint theme boundaries. Then the theme is designed on its own:
 * tokens and fonts in {id}.css / fonts.ts, slots in slots/ (see src/themes/rakim).
 *
 *   pnpm tema:yeni --id kepce
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { addTheme, addThemeMeta, renameTheme } from "./mekan-sablon";

const { values } = parseArgs({ options: { id: { type: "string" } } });
const id = values.id ?? "";
if (!/^[a-z][a-z0-9-]{1,20}$/.test(id) || id === "sade") {
  throw new Error("--id küçük harf, rakam ve tire olmalı (ör. --id kepce)");
}

const root = fileURLToPath(new URL("..", import.meta.url));
const copies = [
  [join(root, "src/themes/sade"), join(root, "src/themes", id)],
  [join(root, "src/app/tema-sade"), join(root, "src/app", `tema-${id}`)],
] as const;

function rewrite(dir: string) {
  for (const entry of readdirSync(dir)) {
    let path = join(dir, entry);
    if (entry.includes("sade")) {
      const renamed = join(dir, renameTheme(entry, id));
      renameSync(path, renamed);
      path = renamed;
    }
    if (statSync(path).isDirectory()) rewrite(path);
    else if (/\.(tsx?|css)$/.test(path))
      writeFileSync(path, renameTheme(readFileSync(path, "utf8"), id));
  }
}

for (const [from, to] of copies) {
  if (existsSync(to)) throw new Error(`${to} zaten var`);
  cpSync(from, to, { recursive: true });
  rewrite(to);
}

for (const file of ["src/platform/tenant/registry-schema.ts", "eslint.config.mjs"]) {
  const path = join(root, file);
  writeFileSync(path, addTheme(readFileSync(path, "utf8"), id));
}
const metaPath = join(root, "src/themes/meta.ts");
writeFileSync(metaPath, addThemeMeta(readFileSync(metaPath, "utf8"), id));
execSync(`pnpm exec eslint --fix src/themes src/app/tema-${id}`, { cwd: root, stdio: "ignore" });
execSync(`pnpm exec prettier --write src/themes src/app/tema-${id} --log-level warn`, {
  cwd: root,
  stdio: "inherit",
});

console.log(`✓ src/themes/${id}/ ve src/app/tema-${id}/ Sade'den kopyalandı; THEMES ve ESLint'e eklendi.
Sıradaki: pnpm typecheck; ${id}.css'te token'lar, fonts.ts'te yazı tipi; mekânın mekan.ts'inde tema "${id}".`);
