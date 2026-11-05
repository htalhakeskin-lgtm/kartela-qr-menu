import Image from "next/image";
import type { Components } from "react-markdown";

import { StoryMarkdown } from "@/components/markdown/story-markdown";
import { uiText } from "@/platform/i18n/ui";
import { itemIndex, type StoryView, type VenueView } from "@/platform/menu/view";
import { BaseStory } from "@/platform/theme/base/story";
import { T } from "@/platform/theme/base/text";
import type { StoryProps } from "@/platform/theme/contract";

/**
 * Rakım's Keşfet stories (plan §11.5, REQ-020, D-17), laid out by kind rather than one column:
 * - chapter (origins): the first is the opening — the photo across the page, the big title under
 *   it, not on it; the others in two asymmetric columns that swap sides;
 * - guide (brewing steps): a numbered sequence — the step number large in Plex Mono, the text,
 *   a small photo — so a whole method reads at a glance (the Kurasu reference);
 * - supplier: a wide band; chef_note: a 640 px text column with a mono label.
 * A server component: the Markdown is rendered here and never reaches a bundle (K-34).
 */

const markdown: Components = {
  h1: ({ children }) => <h3 className="mt-8 text-lg font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-8 text-lg font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-6 font-semibold">{children}</h4>,
  p: ({ children }) => <p className="mt-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="mt-4 space-y-1 font-mono text-sm text-muted-foreground">{children}</ul>
  ),
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 ps-6">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

function Body({ story, venue }: { story: StoryView; venue: VenueView }) {
  return (
    <div
      lang={story.body.lang === venue.locale ? undefined : story.body.lang}
      dir={story.body.lang === venue.locale ? undefined : "auto"}
      className="max-w-[40rem]"
    >
      <StoryMarkdown
        markdown={story.body.text}
        components={markdown}
        linkClassName="underline decoration-1 underline-offset-4 hover:decoration-2"
      />
    </div>
  );
}

function ProductLinks({ story, venue }: { story: StoryView; venue: VenueView }) {
  const items = itemIndex(venue);
  const linked = story.itemIds.flatMap((id) => {
    const item = items.get(id);
    return item ? [item] : [];
  });
  if (linked.length === 0) return null;
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label={uiText(venue.locale).goToItem}>
      {linked.map((item) => (
        <li key={item.id}>
          <a
            href={`./#urun-${encodeURIComponent(item.slug)}`}
            className="flex min-h-11 items-center rounded-full border border-border px-4 text-sm hover:border-foreground"
          >
            <T text={item.name} page={venue.locale} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function Cover({
  story,
  sizes,
  className,
  priority = false,
}: {
  story: StoryView;
  sizes: string;
  className: string;
  priority?: boolean;
}) {
  if (!story.cover) return null;
  return (
    <Image
      src={story.cover.src}
      alt={story.cover.alt.text}
      width={story.cover.width}
      height={story.cover.height}
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      style={{ objectPosition: `${String(story.cover.focalX)}% ${String(story.cover.focalY)}%` }}
    />
  );
}

function Heading({
  story,
  venue,
  level,
  className,
}: {
  story: StoryView;
  venue: VenueView;
  level: 2 | 3;
  className: string;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag id={`hikaye-${story.id}`} className={className}>
      <T text={story.title} page={venue.locale} />
    </Tag>
  );
}

export function RakimStory(props: StoryProps) {
  const { story, venue, headingLevel } = props;
  const summary = story.summary ? (
    <p className="mt-2 text-lg text-muted-foreground">
      <T text={story.summary} page={venue.locale} />
    </p>
  ) : null;

  if (story.kind === "chapter" && story.stop === 1) {
    return (
      <article aria-labelledby={`hikaye-${story.id}`} className="pt-8 pb-12 md:pb-16">
        <Cover
          story={story}
          priority
          sizes="(min-width: 1024px) 960px, 100vw"
          className="-mx-4 aspect-[4/3] w-[calc(100%+2rem)] max-w-none md:mx-0 md:aspect-[16/9] md:w-full md:rounded-[6px]"
        />
        <Heading
          story={story}
          venue={venue}
          level={headingLevel}
          className="mt-8 text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl"
        />
        {summary}
        <Body story={story} venue={venue} />
      </article>
    );
  }

  if (story.kind === "chapter") {
    const flip = (story.stop ?? 0) % 2 === 1;
    return (
      <article
        aria-labelledby={`hikaye-${story.id}`}
        className="py-10 md:grid md:grid-cols-12 md:items-start md:gap-10 md:py-16"
      >
        <figure className={`md:col-span-5 ${flip ? "md:order-2 md:col-start-8" : ""}`}>
          {/* The origin photos are landscape: 4:3 on a phone, a 4:5 crop beside the text on wide
              screens — requested wide enough to cover the crop without upscaling (GK-04). */}
          <Cover
            story={story}
            sizes="(min-width: 1024px) 640px, (min-width: 768px) 60vw, 100vw"
            className="aspect-[4/3] w-full rounded-[6px] md:aspect-[4/5]"
          />
        </figure>
        <div className={`mt-6 md:col-span-7 md:mt-0 ${flip ? "md:order-1" : ""}`}>
          <p className="font-mono text-xs text-muted-foreground">
            {String(story.stop ?? 0).padStart(2, "0")}
          </p>
          <Heading
            story={story}
            venue={venue}
            level={headingLevel}
            className="mt-1 text-2xl leading-tight font-bold tracking-tight md:text-3xl"
          />
          {summary}
          <Body story={story} venue={venue} />
          <ProductLinks story={story} venue={venue} />
        </div>
      </article>
    );
  }

  if (story.kind === "guide") {
    return (
      <article
        aria-labelledby={`hikaye-${story.id}`}
        className="grid grid-cols-[3.5rem_1fr] gap-x-4 py-8 md:grid-cols-[5rem_1fr_16rem] md:gap-x-8"
      >
        <p className="font-mono text-4xl leading-none text-accent tabular-nums md:text-5xl">
          {String(story.stop ?? 0).padStart(2, "0")}
        </p>
        <div>
          <Heading
            story={story}
            venue={venue}
            level={headingLevel}
            className="text-xl leading-tight font-bold tracking-tight"
          />
          <Body story={story} venue={venue} />
          <ProductLinks story={story} venue={venue} />
        </div>
        {story.cover ? (
          <figure className="col-start-2 mt-4 md:col-start-3 md:row-start-1 md:mt-0">
            <Cover
              story={story}
              sizes="(min-width: 768px) 256px, 80vw"
              className="aspect-[4/3] w-full rounded-[6px]"
            />
          </figure>
        ) : null}
      </article>
    );
  }

  if (story.kind === "supplier") {
    return (
      <article aria-labelledby={`hikaye-${story.id}`} className="py-10 md:py-16">
        <Cover
          story={story}
          sizes="(min-width: 1024px) 960px, 100vw"
          className="aspect-[16/9] w-full rounded-[6px] md:aspect-[21/9]"
        />
        <div className="mt-6 md:grid md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <Heading
              story={story}
              venue={venue}
              level={headingLevel}
              className="text-2xl leading-tight font-bold tracking-tight md:text-3xl"
            />
            {summary}
          </div>
          <div className="md:col-span-7">
            <Body story={story} venue={venue} />
            <ProductLinks story={story} venue={venue} />
          </div>
        </div>
      </article>
    );
  }

  if (story.kind === "chef_note") {
    return (
      <article
        aria-labelledby={`hikaye-${story.id}`}
        className="mx-auto max-w-[40rem] py-10 md:py-16"
      >
        <p className="font-mono text-xs text-muted-foreground">
          {venue.locale === "tr" ? "Barista notu" : "Barista note"}
        </p>
        <Heading
          story={story}
          venue={venue}
          level={headingLevel}
          className="mt-1 text-2xl leading-tight font-bold tracking-tight"
        />
        <Body story={story} venue={venue} />
        <ProductLinks story={story} venue={venue} />
      </article>
    );
  }

  return <BaseStory {...props} />;
}
