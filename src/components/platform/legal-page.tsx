import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { LegalDocument } from "@/server/content/legal";

/**
 * Renders a legal text on the server. react-markdown builds React elements (no raw HTML, no
 * dangerouslySetInnerHTML) and ships no JavaScript: it only runs in this server component
 * (plan K-34). Tables scroll inside their own box on phones (07-mobil: no page overflow).
 */
export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <p className="mb-8 rounded-md bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
        Örnek metindir; hukuki geçerliliği yoktur. Gerçek bir işletmede hukuk danışmanı onayıyla
        yayımlanır.
      </p>
      <article className="legal-text">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-10 text-xl font-semibold tracking-tight">{children}</h2>
            ),
            p: ({ children }) => <p className="mt-4 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-6">{children}</ul>,
            a: ({ children, href }) => (
              <a href={href} className="underline underline-offset-4">
                {children}
              </a>
            ),
            table: ({ children }) => (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard reachable (axe scrollable-region-focusable)
              <div className="mt-6 overflow-x-auto" tabIndex={0} role="region" aria-label="Tablo">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border-b border-border px-3 py-2 align-top font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-border px-3 py-2 align-top">{children}</td>
            ),
          }}
        >
          {document.body}
        </Markdown>
      </article>
      <p className="mt-10 text-sm text-muted-foreground">
        Sürüm {document.version} · Yürürlük {document.effectiveOn}
      </p>
    </main>
  );
}
