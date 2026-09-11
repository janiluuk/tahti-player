import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CompassIcon,
  HeadphonesIcon,
  KeyboardIcon,
  LifeBuoyIcon,
  ListIcon,
  PlugIcon,
  RadioTowerIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import {
  Badge,
  Box,
  Button,
  EmptyState,
  Input,
  SectionShell,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { HelpKeyboardShortcuts } from '../components/HelpKeyboardShortcuts';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { StudioPanel } from '../components/StudioPanel';
import { SupportContactForm } from '../components/SupportContactForm';
import {
  getHelpArticle,
  HELP_ARTICLES,
  type HelpArticle,
} from '../content/help';
import { KEYBOARD_NAVIGATION_SECTIONS } from '../content/keyboardNavigation';
import { useTourStore } from '../stores/tourStore';

const PRODUCTION = 'https://tahti.live';

const GUIDE_GROUPS: Array<{
  id: string;
  title: string;
  description: string;
  icon: typeof HeadphonesIcon;
  slugs: string[];
}> = [
  {
    id: 'start-here',
    title: 'Start here',
    description: 'Find something to listen to or set up your artist profile.',
    icon: HeadphonesIcon,
    slugs: ['getting-around', 'for-listeners', 'player', 'for-artists'],
  },
  {
    id: 'listen-and-share',
    title: 'Listen and share',
    description: 'Save music, talk about moments, and share public pages.',
    icon: HeadphonesIcon,
    slugs: [
      'favorites-playlists',
      'comments-and-timeline',
      'notifications',
      'embed-and-share',
    ],
  },
  {
    id: 'artist-tools',
    title: 'Artist tools',
    description: 'Publish music, design your channel, and follow earnings.',
    icon: SparklesIcon,
    slugs: ['channel-design', 'uploads-and-processing', 'earnings'],
  },
  {
    id: 'broadcasting',
    title: 'Broadcasting',
    description: 'Get on air and mirror your show to other platforms.',
    icon: RadioTowerIcon,
    slugs: ['broadcast', 'multistream'],
  },
  {
    id: 'releasing',
    title: 'Releasing',
    description:
      'Understand release identifiers, catalogs, smart links, and delivery.',
    icon: BookOpenIcon,
    slugs: ['releasing'],
  },
  {
    id: 'account-support',
    title: 'Account and support',
    description: 'Understand limits, shortcuts, and where to get help.',
    icon: ShieldCheckIcon,
    slugs: ['tier-limits', 'keyboard-shortcuts', 'support'],
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Understand platform operations.',
    icon: ShieldCheckIcon,
    slugs: ['admin-guide'],
  },
  {
    id: 'add-ons',
    title: 'Add-ons',
    description:
      'Themes, imports, live mirrors, audio tools, and page widgets.',
    icon: PlugIcon,
    slugs: ['add-ons', 'desktop-mcp', 'desktop-library'],
  },
  {
    id: 'build-with-tahti',
    title: 'Build with Tahti',
    description: 'Learn how to make a Disco-widget for the platform.',
    icon: SparklesIcon,
    slugs: ['disco-widgets'],
  },
];

const QUICK_STARTS = [
  {
    title: 'I want to listen',
    description: 'Browse channels, play Tahti Radio, and join the community.',
    slug: 'for-listeners',
    icon: HeadphonesIcon,
  },
  {
    title: 'I want to broadcast',
    description: 'Create a channel and connect your broadcast software.',
    slug: 'for-artists',
    icon: RadioTowerIcon,
  },
  {
    title: 'Keyboard navigation',
    description:
      'Global shortcuts for Listen, Radio, Library, Studio, and the tour.',
    slug: 'keyboard-shortcuts',
    icon: KeyboardIcon,
  },
  {
    title: 'I need support',
    description: 'Send the team a question about your account or a problem.',
    slug: 'support',
    icon: LifeBuoyIcon,
  },
] as const;

const DOCUMENT_GROUPS = [
  {
    id: 'transparency',
    label: 'Transparency',
    items: [
      {
        title: 'Transparency dashboard',
        description: 'Current ledger, grants, and public financial totals.',
        to: '/transparency',
      },
      {
        title: 'Grant reports',
        description: 'Browse annual grant distribution reports by year.',
        to: '/transparency',
      },
      {
        title: 'Transparency methodology',
        description: 'How figures are recorded, reviewed, and published.',
        to: '/transparency/methodology',
      },
    ],
  },
  {
    id: 'legal',
    label: 'Legal & policies',
    items: [
      {
        title: 'About Tahti',
        description: 'Mission, cooperative structure, and commitments.',
        to: '/about',
      },
      {
        title: 'Terms of service',
        description: 'The rules for using Tahti services.',
        to: '/terms',
      },
      {
        title: 'Privacy policy',
        description: 'What data is collected and how it is handled.',
        to: '/privacy',
      },
      {
        title: 'AGPL source licence',
        description: 'The licence and source-code obligations for Tahti.',
        to: '/agpl',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        title: 'Platform status',
        description: 'Current service health and incident information.',
        to: '/status',
      },
      {
        title: 'Platform news',
        description: 'News, service updates, and posts from the Tahti team.',
        to: '/news',
      },
      {
        title: 'Support',
        description: 'Contact support about an account or platform problem.',
        to: '/help/support',
      },
      {
        title: 'Admin guide',
        description: 'Operational guidance for board and platform admins.',
        to: '/help/admin-guide',
      },
    ],
  },
] as const;

function articleMatches(article: HelpArticle, query: string): boolean {
  const keyboardExtra =
    article.slug === 'keyboard-shortcuts'
      ? KEYBOARD_NAVIGATION_SECTIONS.flatMap((section) => [
          section.heading,
          ...(section.notes ?? []),
          ...section.rows.flatMap((row) => [row.label, row.shortcut]),
        ])
      : [];
  const haystack = [
    article.title,
    article.description,
    ...keyboardExtra,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.body,
      ...(section.table
        ? [...section.table.columns, ...section.table.rows.flat()]
        : []),
    ]),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function sectionId(heading: string, index: number): string {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'section'}-${index}`;
}

function HelpLinkCard({
  title,
  description,
  meta,
  icon,
}: {
  title: string;
  description: string;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Box
      variant="tertiary"
      shadow="default"
      className="group hover:border-primary flex min-h-32 min-w-0 flex-col justify-between gap-3 transition-colors"
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display min-w-0 text-base font-bold tracking-tight">
              {title}
            </h3>
            <ArrowRightIcon
              size={17}
              aria-hidden
              className="text-foreground-secondary mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5"
            />
          </div>
          <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {meta ? <div className="mt-auto">{meta}</div> : null}
    </Box>
  );
}

function HelpGuideCard({ article }: { article: HelpArticle }) {
  return (
    <Link to="/help/$slug" params={{ slug: article.slug }} className="min-w-0">
      <HelpLinkCard
        title={article.title}
        description={article.description}
        meta={
          <Badge variant="pill" color="secondary">
            {article.sections.length}{' '}
            {article.sections.length === 1 ? 'section' : 'sections'}
          </Badge>
        }
      />
    </Link>
  );
}

export function HelpHubView() {
  const [query, setQuery] = useState('');
  const startTour = useTourStore((state) => state.start);
  const visibleGroups = useMemo(
    () =>
      GUIDE_GROUPS.map((group) => ({
        ...group,
        articles: group.slugs
          .map((slug) => getHelpArticle(slug))
          .filter(
            (article): article is HelpArticle =>
              article !== undefined && articleMatches(article, query),
          ),
      })).filter((group) => group.articles.length > 0),
    [query],
  );

  return (
    <ViewShell
      title="Help"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-full min-w-0 pb-8' }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tooltip content="Take a guided tour of this page" side="bottom">
          <Button
            size="icon-sm"
            aria-label="Take Tour"
            className="bg-accent-purple hover:bg-accent-purple/90 text-white"
            onClick={() => startTour()}
          >
            <CompassIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>

      <StudioPanel
        title="Documents and public records"
        description="Find transparency, governance, legal, and service documents from one place."
        className="min-w-0"
      >
        <div data-help-documents>
          <p className="text-foreground-secondary mb-3 text-xs font-bold tracking-[0.16em] uppercase">
            Reference library
          </p>
          <Tabs
            items={DOCUMENT_GROUPS.map((group) => ({
              id: group.id,
              label: group.label,
              content: (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.title}
                      to={item.to as never}
                      className="min-w-0"
                    >
                      <HelpLinkCard
                        title={item.title}
                        description={item.description}
                      />
                    </Link>
                  ))}
                </div>
              ),
            }))}
            listClassName="overflow-x-auto"
          />
        </div>
      </StudioPanel>

      <SectionShell title="Pick a path" data-testid="help-quick-start">
        <div
          data-help-hub-panel
          className="mb-3 flex items-end justify-between gap-3"
        >
          <p className="text-foreground-secondary text-xs font-bold tracking-[0.16em] uppercase">
            Quick start
          </p>
          <Badge variant="pill" color="secondary">
            {HELP_ARTICLES.length} guides
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {QUICK_STARTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to="/help/$slug"
                params={{ slug: item.slug }}
                className="min-w-0"
              >
                <HelpLinkCard
                  title={item.title}
                  description={item.description}
                  icon={<Icon size={18} aria-hidden />}
                />
              </Link>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell title="Browse all help" data-testid="help-guide-index">
        <div
          data-help-hub-panel
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <p className="text-foreground-secondary text-xs font-bold tracking-[0.16em] uppercase">
            Guide index
          </p>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides…"
            aria-label="Search help guides"
            className="w-full sm:max-w-sm"
            startAddon={
              <SearchIcon size={16} aria-hidden className="opacity-70" />
            }
          />
        </div>

        {visibleGroups.length === 0 ? (
          <EmptyState
            title="No guides match"
            description={`Try another search${query ? ` instead of “${query}”` : ''}.`}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setQuery('')}
              >
                Clear search
              </Button>
            }
          />
        ) : query.trim() ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleGroups.flatMap((group) =>
              group.articles.map((article) => (
                <HelpGuideCard key={article.slug} article={article} />
              )),
            )}
          </div>
        ) : (
          <Tabs
            items={visibleGroups.map((group) => {
              const GroupIcon = group.icon;
              return {
                id: group.id,
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <GroupIcon size={14} aria-hidden />
                    {group.title}
                  </span>
                ),
                content: (
                  <div className="flex min-w-0 flex-col gap-3">
                    <p className="text-foreground-secondary text-sm">
                      {group.description}
                    </p>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.articles.map((article) => (
                        <HelpGuideCard key={article.slug} article={article} />
                      ))}
                    </div>
                  </div>
                ),
              };
            })}
            listClassName="overflow-x-auto"
          />
        )}
      </SectionShell>

      <p className="text-foreground-secondary border-border border-t pt-5 text-xs">
        Looking for the latest public version?{' '}
        <a
          href={`${PRODUCTION}/help`}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          Open tahti.live/help
        </a>
        .
      </p>
    </ViewShell>
  );
}

function getRelatedArticles(slug: string): HelpArticle[] {
  const group = GUIDE_GROUPS.find((item) => item.slugs.includes(slug));
  if (!group) {
    return [];
  }
  return group.slugs
    .filter((related) => related !== slug)
    .map((related) => getHelpArticle(related))
    .filter((related): related is HelpArticle => related !== undefined);
}

export function HelpArticleView({ slug }: { slug: string }) {
  const article = getHelpArticle(slug);
  if (!article) {
    return (
      <PageFrame maxWidth="3xl">
        <EmptyState
          title="Article not found"
          description={`No help page for ${slug}.`}
          action={
            <Link to="/help">
              <Button size="sm" variant="secondary">
                Back to help hub
              </Button>
            </Link>
          }
        />
      </PageFrame>
    );
  }

  const related = getRelatedArticles(slug);

  return (
    <PageFrame maxWidth="full" className="max-w-5xl min-w-0 pb-8">
      <PageHeader
        title={article.title}
        subtitle={article.description}
        back={
          <Link to="/help">
            <Button size="xs" variant="text">
              <ArrowLeftIcon size={14} aria-hidden className="mr-1" />
              Help center
            </Button>
          </Link>
        }
        meta={
          article.productionPath ? (
            <a
              href={`${PRODUCTION}${article.productionPath}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
            >
              Open on tahti.live{article.productionPath}
            </a>
          ) : null
        }
      />

      <div className="grid min-w-0 gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="h-fit lg:sticky lg:top-4">
          <Box variant="tertiary" shadow="default" className="flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ListIcon size={16} aria-hidden />
              In this guide
            </div>
            <nav className="flex flex-col gap-2" aria-label="Article sections">
              {slug === 'keyboard-shortcuts'
                ? KEYBOARD_NAVIGATION_SECTIONS.map((section, index) => {
                    const id = section.heading
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    return (
                      <a
                        key={section.heading}
                        href={`#${id || 'section'}`}
                        className="text-foreground-secondary hover:text-foreground text-xs leading-relaxed"
                      >
                        {index + 1}. {section.heading}
                      </a>
                    );
                  })
                : article.sections.map((section, index) => (
                    <a
                      key={`${section.heading}-${index}`}
                      href={`#${sectionId(section.heading, index)}`}
                      className="text-foreground-secondary hover:text-foreground text-xs leading-relaxed"
                    >
                      {index + 1}. {section.heading}
                    </a>
                  ))}
            </nav>
          </Box>
        </aside>

        <article className="min-w-0">
          <div className="flex flex-col gap-4">
            {slug === 'keyboard-shortcuts' ? (
              <Box
                variant="tertiary"
                shadow="default"
                className="scroll-mt-4 flex-col gap-3 sm:p-6"
              >
                <HelpKeyboardShortcuts />
              </Box>
            ) : (
              article.sections.map((section, index) => (
                <Box
                  key={`${section.heading}-${index}`}
                  id={sectionId(section.heading, index)}
                  variant="tertiary"
                  shadow="default"
                  className="scroll-mt-4 flex-col gap-3 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="pill" color="inverted">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-xl font-bold tracking-tight">
                        {section.heading}
                      </h2>
                      {section.body.length > 0 ? (
                        <ul className="text-foreground-secondary mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
                          {section.body.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      ) : null}
                      {section.table ? (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                            <caption className="sr-only">
                              {section.heading}
                            </caption>
                            <thead>
                              <tr className="border-border border-b">
                                {section.table.columns.map((column) => (
                                  <th
                                    key={column}
                                    className="text-foreground px-2 py-2 font-semibold"
                                  >
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {section.table.rows.map((row) => (
                                <tr
                                  key={row.join('|')}
                                  className="border-border border-b last:border-b-0"
                                >
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={`${row[0]}-${cellIndex}`}
                                      className="text-foreground-secondary px-2 py-2 align-top leading-relaxed"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Box>
              ))
            )}
          </div>

          {slug === 'support' && (
            <div className="mt-6">
              <SupportContactForm />
            </div>
          )}

          {related.length > 0 && (
            <nav
              aria-label="Related guides"
              className="border-border mt-8 border-t pt-5"
            >
              <SectionShell title="Related guides">
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      to="/help/$slug"
                      params={{ slug: item.slug }}
                      className="min-w-0"
                    >
                      <HelpLinkCard
                        title={item.title}
                        description={item.description}
                      />
                    </Link>
                  ))}
                </div>
              </SectionShell>
            </nav>
          )}
        </article>
      </div>
    </PageFrame>
  );
}
