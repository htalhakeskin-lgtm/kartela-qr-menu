import Image from "next/image";
import type { Components } from "react-markdown";

import { StoryMarkdown } from "../../../components/markdown/story-markdown";
import { uiText } from "../../i18n/ui";
import { itemIndex } from "../../menu/view";
import type { StoryProps } from "../contract";
import { T } from "./text";

/**
 * Story slot (SCR-002, REQ-010): cover, stop number, title, summary, the Markdown body rendered on
 * the server (K-34), gallery, and links to the products it is about. Two layouts: akış (one column)
 * and dergi (photo and text side by side on wide screens, alternating).
 */

/** Markdown headings sit under the story's own heading: # / ## → h3, ### → h4. */
const markdownComponents: Components = {
  h1: ({ children }) => <h3 className="mt-8 text-lg font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-8 text-lg font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-6 font-semibold">{children}</h4>,
  p: ({ children }) => <p className="mt-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 ps-6">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 ps-6">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

export function BaseStory({ story, venue, layout, headingLevel, index }: StoryProps) {
  const ui = uiText(venue.locale);
  const items = itemIndex(venue);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const linked = story.itemIds.flatMap((id) => {
    const item = items.get(id);
    return item ? [item] : [];
  });
  const magazine = layout === "dergi" && story.cover !== null;

  return (
    <article
      aria-labelledby={`hikaye-${story.id}`}
      className={`py-10 md:py-16 ${magazine ? "md:grid md:grid-cols-2 md:items-start md:gap-10" : ""}`}
    >
      {story.cover ? (
        <figure className={magazine && index % 2 === 1 ? "md:order-2" : undefined}>
          <Image
            src={story.cover.src}
            alt={story.cover.alt.text}
            width={story.cover.width}
            height={story.cover.height}
            sizes={magazine ? "(min-width: 768px) 480px, 100vw" : "(min-width: 768px) 720px, 100vw"}
            className="aspect-[4/3] w-full rounded-md object-cover"
            style={{
              objectPosition: `${String(story.cover.focalX)}% ${String(story.cover.focalY)}%`,
            }}
          />
        </figure>
      ) : null}
      <div className={story.cover ? "mt-6 md:mt-0" : undefined}>
        {story.stop !== null ? (
          <p className="text-sm font-medium text-accent tabular-nums">
            {String(story.stop).padStart(2, "0")}
          </p>
        ) : null}
        <Heading
          id={`hikaye-${story.id}`}
          className="text-2xl leading-tight font-semibold tracking-tight"
        >
          <T text={story.title} page={venue.locale} />
        </Heading>
        {story.summary ? (
          <p className="mt-2 text-lg text-muted-foreground">
            <T text={story.summary} page={venue.locale} />
          </p>
        ) : null}
        <div
          lang={story.body.lang === venue.locale ? undefined : story.body.lang}
          dir={story.body.lang === venue.locale ? undefined : "auto"}
          className="max-w-[40rem]"
        >
          <StoryMarkdown
            markdown={story.body.text}
            components={markdownComponents}
            linkClassName="underline decoration-1 underline-offset-4 hover:decoration-2"
          />
        </div>
        {story.gallery.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {story.gallery.map((photo) => (
              <li key={photo.src}>
                <Image
                  src={photo.src}
                  alt={photo.alt.text}
                  width={photo.width}
                  height={photo.height}
                  sizes="(min-width: 768px) 340px, 50vw"
                  className="aspect-square w-full rounded-md object-cover"
                />
              </li>
            ))}
          </ul>
        ) : null}
        {linked.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label={ui.goToItem}>
            {linked.map((item) => (
              <li key={item.id}>
                {/* Relative to the Keşfet page, on the venue's domain or a /m/ preview alike. */}
                <a
                  href={`./#urun-${encodeURIComponent(item.slug)}`}
                  className="flex min-h-11 items-center rounded-full border border-border px-4 text-sm hover:border-foreground"
                >
                  <T text={item.name} page={venue.locale} />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
