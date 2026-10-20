import { PlusIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import {
  NEWS_FEED_PRESET_GROUPS,
  type NewsFeedPreset,
} from '../content/newsFeedPresets';

/** One-click DJ and production feeds for the News add-on. */
export function NewsFeedSuggestions({
  addedUrls,
  onAdd,
}: {
  addedUrls: ReadonlySet<string>;
  onAdd: (feed: NewsFeedPreset) => void;
}) {
  return (
    <div className="flex flex-col gap-4" data-testid="news-feed-suggestions">
      {NEWS_FEED_PRESET_GROUPS.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <h4 className="text-foreground-secondary text-xs font-bold tracking-wide uppercase">
            {group.title}
          </h4>
          <ul className="divide-border flex flex-col divide-y">
            {group.feeds.map((feed) => {
              const added = addedUrls.has(feed.url);
              return (
                <li
                  key={feed.url}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{feed.title}</p>
                    <p className="text-foreground-secondary truncate text-xs">
                      {feed.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={added}
                    onClick={() => onAdd(feed)}
                    aria-label={
                      added ? `${feed.title} added` : `Add ${feed.title}`
                    }
                  >
                    {added ? (
                      'Added'
                    ) : (
                      <>
                        <PlusIcon size={14} aria-hidden className="mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
