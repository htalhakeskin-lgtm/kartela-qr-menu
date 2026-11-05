import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Keşfet story body (D-07, plan K-34): Markdown rendered on the server into React elements, so
 * no JavaScript reaches the menu page and nothing goes through dangerouslySetInnerHTML. A theme
 * styles it through `components`; the safety rules here are not negotiable:
 *
 * - raw HTML in the source is dropped (skipHtml), not escaped into the text
 * - inline images are dropped: photos come from the image register with their real size, alt
 *   text and source (20-gorsel-kalite), as the story's cover and gallery
 * - unsafe link protocols (javascript:, data:) are neutralised by react-markdown's default
 *   urlTransform; links leaving the site open with rel="noopener noreferrer"
 */
export function StoryMarkdown({
  markdown,
  components,
  linkClassName,
}: {
  markdown: string;
  components?: Components;
  /** A theme's link style; links stay distinguishable from text (WCAG 1.4.1: underline). */
  linkClassName?: string;
}) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      disallowedElements={["img"]}
      unwrapDisallowed
      components={{
        a: ({ href, children }) => {
          const external = href !== undefined && /^https?:\/\//.test(href);
          return (
            <a
              href={href}
              rel={external ? "noopener noreferrer" : undefined}
              className={linkClassName}
            >
              {children}
            </a>
          );
        },
        ...components,
      }}
    >
      {markdown}
    </Markdown>
  );
}
