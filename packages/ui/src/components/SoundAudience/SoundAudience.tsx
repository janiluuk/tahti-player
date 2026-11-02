import {
  HeadphonesIcon,
  HeartIcon,
  LibraryIcon,
  ListMusicIcon,
  Repeat2Icon,
} from 'lucide-react';
import { type FC, type ReactNode } from 'react';

import { cn } from '../../utils';
import { ImageReveal } from '../ImageReveal';
import { MediaArtwork } from '../MediaArtwork';
import { Tabs, type TabsItem } from '../Tabs';

export type SoundAudiencePerson = {
  id: string;
  /** Display name; callers fall back to the username, never an email. */
  name: string;
  username?: string;
  avatarUrl?: string | null;
  href?: string;
  /** Short muted line under the name, e.g. `2 days ago` or `Played 3×`. */
  meta?: string;
};

export type SoundAudienceCollection = {
  id: string;
  name: string;
  coverUrl?: string | null;
  href?: string;
  /** Short muted line under the name, e.g. `by Liina · 24 tracks`. */
  meta?: string;
};

export type SoundAudienceTab = 'collections' | 'likes' | 'reposts' | 'plays';

export type SoundAudienceProps = {
  collections: SoundAudienceCollection[];
  likers: SoundAudiencePerson[];
  reposters: SoundAudiencePerson[];
  listeners: SoundAudiencePerson[];
  /** Totals when a list is a first page of a longer one. */
  counts?: Partial<Record<SoundAudienceTab, number>>;
  defaultTab?: SoundAudienceTab;
  /** Wraps a row in a link, e.g. a router Link. Defaults to a plain anchor. */
  renderLink?: (href: string, children: ReactNode) => ReactNode;
  /** Shown under a list that has more than it shows. */
  renderMore?: (tab: SoundAudienceTab) => ReactNode;
  className?: string;
};

const TAB_ORDER: SoundAudienceTab[] = [
  'collections',
  'likes',
  'reposts',
  'plays',
];

const EMPTY: Record<SoundAudienceTab, string> = {
  collections: 'Not in any public collection yet.',
  likes: 'Nobody has liked this yet.',
  reposts: 'Nobody has reposted this yet.',
  plays: 'No listeners to show yet.',
};

const ROW =
  'hover:bg-background-secondary flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 transition-colors';

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function RowText({ name, meta }: { name: string; meta?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">{name}</span>
      {meta ? (
        <span className="text-foreground-secondary block truncate text-xs">
          {meta}
        </span>
      ) : null}
    </span>
  );
}

const defaultLink = (href: string, children: ReactNode) => (
  <a href={href} className="block no-underline">
    {children}
  </a>
);

/** Who and where around one sound: the public collections it is in, and
 * the people who liked, reposted and played it, each row with a
 * thumbnail. */
export const SoundAudience: FC<SoundAudienceProps> = ({
  collections,
  likers,
  reposters,
  listeners,
  counts,
  defaultTab = 'collections',
  renderLink = defaultLink,
  renderMore,
  className,
}) => {
  const wrap = (href: string | undefined, row: ReactNode) =>
    href ? renderLink(href, row) : row;

  const people = (list: SoundAudiencePerson[]) =>
    list.map((person) => (
      <li key={person.id}>
        {wrap(
          person.href,
          <span className={ROW} data-testid="sound-audience-person">
            <ImageReveal
              src={person.avatarUrl ?? undefined}
              alt=""
              className="bg-background-secondary ring-border size-10 shrink-0 rounded-full ring-1"
              imgClassName="object-cover"
              placeholder={
                <span className="text-foreground-secondary text-sm font-bold">
                  {initialOf(person.name)}
                </span>
              }
            />
            <RowText
              name={person.name}
              meta={
                person.meta ??
                (person.username ? `@${person.username}` : undefined)
              }
            />
          </span>,
        )}
      </li>
    ));

  const collectionRows = collections.map((collection) => (
    <li key={collection.id}>
      {wrap(
        collection.href,
        <span className={ROW} data-testid="sound-audience-collection">
          <MediaArtwork
            size="sm"
            src={collection.coverUrl ?? undefined}
            alt=""
            className="shrink-0 rounded"
            imageReveal={Boolean(collection.coverUrl)}
            placeholder={
              <ListMusicIcon
                size={16}
                className="text-foreground-secondary"
                aria-hidden
              />
            }
          />
          <RowText name={collection.name} meta={collection.meta} />
        </span>,
      )}
    </li>
  ));

  const tabs: Record<
    SoundAudienceTab,
    { label: string; icon: ReactNode; rows: ReactNode[]; length: number }
  > = {
    collections: {
      label: 'Collections',
      icon: <LibraryIcon />,
      rows: collectionRows,
      length: collections.length,
    },
    likes: {
      label: 'Liked',
      icon: <HeartIcon />,
      rows: people(likers),
      length: likers.length,
    },
    reposts: {
      label: 'Reposted',
      icon: <Repeat2Icon />,
      rows: people(reposters),
      length: reposters.length,
    },
    plays: {
      label: 'Played by',
      icon: <HeadphonesIcon />,
      rows: people(listeners),
      length: listeners.length,
    },
  };

  const items: TabsItem[] = TAB_ORDER.map((tab) => {
    const { label, icon, rows, length } = tabs[tab];
    const total = counts?.[tab] ?? length;
    return {
      id: tab,
      label,
      icon,
      count: total,
      content:
        length === 0 ? (
          <p className="text-foreground-secondary px-2 py-6 text-center text-sm">
            {EMPTY[tab]}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <ul
              aria-label={label}
              className="flex flex-col gap-0.5"
              data-testid={`sound-audience-${tab}`}
            >
              {rows}
            </ul>
            {total > length && renderMore ? renderMore(tab) : null}
          </div>
        ),
    };
  });

  return (
    <section
      aria-label="Sound audience"
      data-testid="sound-audience"
      className={cn('flex min-w-0 flex-col gap-3', className)}
    >
      <Tabs
        items={items}
        defaultIndex={Math.max(0, TAB_ORDER.indexOf(defaultTab))}
        listClassName="flex-nowrap gap-1 overflow-x-auto pb-1 [&>*]:shrink-0"
        panelsClassName="pt-2"
      />
    </section>
  );
};
