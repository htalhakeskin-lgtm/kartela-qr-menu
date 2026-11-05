import { uiText } from "../../i18n/ui";
import type { StoryView, VenueView } from "../../menu/view";
import type { ExploreLayout, ThemeSlots } from "../contract";
import { SiteFooter } from "./site-footer";
import type { QuickMenuSlots } from "./slots";

/**
 * Keşfet (SCR-002, REQ-010, D-10): the same venue told as stories. A server component: the
 * Markdown is rendered here and no story code reaches the browser (K-34). Stops of a collection
 * (a guide's steps, a story's chapters) are gathered under the collection's first stop, numbered.
 */
export type ExploreSlots = QuickMenuSlots & Pick<ThemeSlots, "Story">;

type Block = { kind: "story"; story: StoryView } | { kind: "collection"; stops: StoryView[] };

export function exploreBlocks(stories: readonly StoryView[]): Block[] {
  const blocks: Block[] = [];
  const collections = new Map<string, StoryView[]>();
  for (const story of stories) {
    if (story.collection) {
      const stops = collections.get(story.collection);
      if (stops) {
        stops.push(story);
        continue;
      }
      const created = [story];
      collections.set(story.collection, created);
      blocks.push({ kind: "collection", stops: created });
    } else {
      blocks.push({ kind: "story", story });
    }
  }
  for (const block of blocks) {
    if (block.kind === "collection") block.stops.sort((a, b) => (a.stop ?? 0) - (b.stop ?? 0));
  }
  return blocks;
}

export function ExplorePage({
  venue,
  slots,
  layout = "akis",
}: {
  venue: VenueView;
  slots: ExploreSlots;
  layout?: ExploreLayout;
}) {
  const ui = uiText(venue.locale);
  const blocks = exploreBlocks(venue.stories);
  return (
    <slots.Shell venue={venue} view="kesfet">
      <main className="mx-auto max-w-[45rem] px-4 pb-16 lg:max-w-[60rem]">
        <h1 className="pt-10 text-4xl font-semibold tracking-tight md:pt-16 md:text-6xl">
          {ui.explore}
        </h1>
        {blocks.length === 0 ? <slots.EmptyState reason="explore" venue={venue} /> : null}
        <div className="divide-y divide-border">
          {blocks.map((block, index) =>
            block.kind === "story" ? (
              <slots.Story
                key={block.story.id}
                story={block.story}
                venue={venue}
                layout={layout}
                headingLevel={2}
                index={index}
              />
            ) : (
              // A collection's stops in order, each numbered by the Story slot (no invented title).
              <ol key={block.stops[0]?.id} className="divide-y divide-border">
                {block.stops.map((story, stopIndex) => (
                  <li key={story.id}>
                    <slots.Story
                      story={story}
                      venue={venue}
                      layout="akis"
                      headingLevel={2}
                      index={stopIndex}
                    />
                  </li>
                ))}
              </ol>
            ),
          )}
        </div>
        <slots.LegalNote venue={venue} />
        <SiteFooter venue={venue} />
      </main>
    </slots.Shell>
  );
}
