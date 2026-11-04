/**
 * The only component allowed to render HTML strings (03-kod §4). The HTML must have been
 * sanitised on the server with an allow-list when it was saved (11-guvenlik §6); this
 * component does not sanitise again. Keep the branded type so raw strings cannot slip in.
 */
export type SanitizedHtml = string & { readonly __brand: "SanitizedHtml" };

type SafeHtmlProps = { html: SanitizedHtml; className?: string };

export function SafeHtml({ html, className }: SafeHtmlProps) {
  // eslint-disable-next-line no-restricted-syntax -- sanitised on save; the single allowed sink
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function JsonLd({ json }: { json: string }) {
  // eslint-disable-next-line no-restricted-syntax -- output of jsonLd(), "<" escaped
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
