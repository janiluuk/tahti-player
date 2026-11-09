import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CompassIcon,
  HeadphonesIcon,
  KeyboardIcon,
  LifeBuoyIcon,
  LightbulbIcon,
  PlugIcon,
  RadioTowerIcon,
  SearchIcon,
  Share2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCogIcon,
  WrenchIcon,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Box,
  Button,
  ButtonLink,
  cn,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  ExternalLink,
  HorizontalScroll,
  Input,
  SectionShell,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { ContentLanguageToggle } from '../components/ContentLanguageToggle';
import { HelpKeyboardShortcuts } from '../components/HelpKeyboardShortcuts';
import { HelpLinkCard } from '../components/HelpLinkCard';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { PageEmpty } from '../components/PageStates';
import { SupportCenter } from '../components/SupportCenter';
import { serviceDocuments } from '../content/documentLinks';
import { getLocalizedHelpArticle, type HelpArticle } from '../content/help';
import {
  HELP_GROUPS,
  helpGroupOf,
  QUICK_STARTS,
  TONE_CLASSES,
  type HelpGroupId,
  type HelpTone,
  type QuickStartId,
} from '../content/helpUi';
import { KEYBOARD_NAVIGATION_SECTIONS } from '../content/keyboardNavigation';
import { useContentLocale, type ContentLocale } from '../lib/contentLocale';
import { useTourStore } from '../stores/tourStore';

const PRODUCTION = 'https://tahti.live';

const GROUP_ICONS: Record<HelpGroupId, LucideIcon> = {
  'start-here': CompassIcon,
  'listen-and-share': Share2Icon,
  'artist-tools': SparklesIcon,
  broadcasting: RadioTowerIcon,
  releasing: BookOpenIcon,
  'account-support': UserCogIcon,
  admin: ShieldCheckIcon,
  'add-ons': PlugIcon,
  'build-with-tahti': WrenchIcon,
};

const QUICK_START_ICONS: Record<QuickStartId, LucideIcon> = {
  listen: HeadphonesIcon,
  broadcast: RadioTowerIcon,
  keyboard: KeyboardIcon,
  support: LifeBuoyIcon,
};

function quickStartText(
  t: ReturnType<typeof useTranslation<'web'>>['t'],
  id: QuickStartId,
): { title: string; description: string } {
  switch (id) {
    case 'listen':
      return {
        title: t('helpViewMore.iWantToListen'),
        description: t('helpViewMore.browseChannelsPlayTahtiRadio'),
      };
    case 'broadcast':
      return {
        title: t('helpViewMore.iWantToBroadcast'),
        description: t('helpViewMore.createAChannelAndConnect'),
      };
    case 'keyboard':
      return {
        title: t('helpViewMore.keyboardNavigation'),
        description: t('helpHub.keyboardDescription'),
      };
    default:
      return {
        title: t('helpViewMore.iNeedSupport'),
        description: t('helpViewMore.sendTheTeamAQuestion'),
      };
  }
}

function articleMatches(article: HelpArticle, query: string): boolean {
  const keyboardExtra =
    article.slug === 'keyboard-shortcuts'
      ? KEYBOARD_NAVIGATION_SECTIONS.flatMap((section) => [
          i18n.t(`web:${section.headingKey}`),
          ...(section.noteKeys ?? []).map((key) => i18n.t(`web:${key}`)),
          ...section.rows.flatMap((row) => [
            i18n.t(`web:${row.labelKey}`),
            row.shortcut,
          ]),
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

function sectionId(index: number): string {
  return `section-${index + 1}`;
}

function ToneIcon({
  icon: Icon,
  tone,
  size = 'md',
}: {
  icon: LucideIcon;
  tone: HelpTone;
  size?: 'md' | 'lg';
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        TONE_CLASSES[tone].solid,
        size === 'lg' ? 'size-12' : 'size-9',
      )}
    >
      <Icon size={size === 'lg' ? 24 : 18} aria-hidden />
    </span>
  );
}

function localizedArticles(slugs: string[], locale: ContentLocale) {
  return slugs
    .map((slug) => getLocalizedHelpArticle(slug, locale))
    .filter((article): article is HelpArticle => article !== undefined);
}

function ArticleLinkRow({
  article,
  tone,
}: {
  article: HelpArticle;
  tone: HelpTone;
}) {
  return (
    <li>
      <Link
        to="/help/$slug"
        params={{ slug: article.slug }}
        className="group hover:bg-background-secondary flex min-w-0 items-start gap-3 rounded-lg px-2 py-2 transition-colors"
      >
        <span
          className={cn(
            'mt-1.5 size-2 shrink-0 rounded-full',
            TONE_CLASSES[tone].solid,
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{article.title}</span>
          <span className="text-foreground-secondary line-clamp-2 block text-xs leading-relaxed">
            {article.description}
          </span>
        </span>
        <ArrowRightIcon
          size={15}
          aria-hidden
          className="text-foreground-secondary mt-1 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}

export function HelpHubView() {
  const { t } = useTranslation('web');
  const locale = useContentLocale();
  const [query, setQuery] = useState('');
  const startTour = useTourStore((state) => state.start);

  const totalGuides = useMemo(
    () => new Set(HELP_GROUPS.flatMap((group) => group.slugs)).size,
    [],
  );

  const visibleGroups = useMemo(
    () =>
      HELP_GROUPS.map((group) => ({
        ...group,
        title: t(`helpHub.groups.${group.id}.title`),
        description: t(`helpHub.groups.${group.id}.description`),
        articles: localizedArticles(group.slugs, locale).filter((article) =>
          articleMatches(article, query),
        ),
      })).filter((group) => group.articles.length > 0),
    [t, locale, query],
  );

  return (
    <ViewShell
      title={t('helpView.help')}
      data-testid="help-view"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-full min-w-0 pb-8' }}
    >
      <section className="border-border from-accent-blue/15 via-accent-purple/10 to-accent-green/10 mb-6 rounded-2xl border bg-gradient-to-br p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
              {t('helpHub.hubHeading')}
            </h2>
            <p className="text-foreground-secondary mt-2 max-w-xl text-sm leading-relaxed sm:text-base">
              {t('helpHub.hubIntro')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ContentLanguageToggle />
            <Tooltip content={t('helpView.takeAGuidedTourOf')} side="bottom">
              <Button
                size="icon-sm"
                aria-label={t('helpView.takeTour')}
                className="bg-accent-purple hover:bg-accent-purple/90 text-white"
                onClick={() => startTour()}
              >
                <CompassIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div data-help-hub-panel className="mt-5 flex items-center gap-3">
          <Input
            enterKeyHint="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('helpView.searchGuides')}
            aria-label={t('helpView.searchHelpGuides')}
            className="w-full sm:max-w-md"
            startAddon={
              <SearchIcon size={16} aria-hidden className="opacity-70" />
            }
          />
          <Badge
            variant="pill"
            color="secondary"
            className="hidden sm:inline-flex"
          >
            {t('helpHub.guidesCount', { count: totalGuides })}
          </Badge>
        </div>
      </section>

      {query.trim() ? null : (
        <SectionShell
          title={t('helpView.pickAPath')}
          data-testid="help-quick-start"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_STARTS.map((item) => {
              const text = quickStartText(t, item.id);
              const tone = TONE_CLASSES[item.tone];
              return (
                <Link
                  key={item.id}
                  to="/help/$slug"
                  params={{ slug: item.slug }}
                  className={cn(
                    'group flex min-w-0 flex-col gap-3 rounded-xl border-2 p-4 transition-transform hover:-translate-y-0.5',
                    tone.border,
                    tone.soft,
                  )}
                >
                  <ToneIcon
                    icon={QUICK_START_ICONS[item.id]}
                    tone={item.tone}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-display flex items-center gap-1.5 text-base font-bold tracking-tight">
                      {text.title}
                      <ArrowRightIcon
                        size={16}
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </h3>
                    <p className="text-foreground-secondary mt-1 text-sm leading-relaxed">
                      {text.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </SectionShell>
      )}

      <SectionShell
        title={t('helpView.browseAllHelp')}
        data-testid="help-guide-index"
      >
        {visibleGroups.length === 0 ? (
          <PageEmpty
            title={t('empties.noGuidesMatch')}
            description={t('helpHub.noMatchDescription', { query })}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setQuery('')}
              >
                {t('helpView.clearSearch')}
              </Button>
            }
          />
        ) : (
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleGroups.map((group) => (
              <section
                key={group.id}
                aria-labelledby={`help-group-${group.id}`}
                className={cn(
                  'border-border bg-background-secondary/40 flex min-w-0 flex-col gap-3 rounded-xl border border-t-4 p-4',
                  TONE_CLASSES[group.tone].border,
                )}
              >
                <div className="flex items-start gap-3">
                  <ToneIcon icon={GROUP_ICONS[group.id]} tone={group.tone} />
                  <div className="min-w-0">
                    <h3
                      id={`help-group-${group.id}`}
                      className="font-display text-base font-bold tracking-tight"
                    >
                      {group.title}
                    </h3>
                    <p className="text-foreground-secondary text-xs leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                </div>
                <ul className="-mx-2 flex flex-col">
                  {group.articles.map((article) => (
                    <ArticleLinkRow
                      key={article.slug}
                      article={article}
                      tone={group.tone}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell
        title={t('helpView.policiesAndService')}
        data-testid="help-policies"
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {serviceDocuments(t).map((item) => (
            <Link key={item.title} to={item.to as never} className="min-w-0">
              <HelpLinkCard title={item.title} description={item.description} />
            </Link>
          ))}
        </div>
      </SectionShell>

      <p className="text-foreground-secondary border-border border-t pt-5 text-xs">
        Looking for the latest public version?{' '}
        <ExternalLink
          href={`${PRODUCTION}/help`}
          className="no-underline underline-offset-2 hover:underline"
        >
          {t('helpView.openTahtiLiveHelp')}
        </ExternalLink>
        .
      </p>
    </ViewShell>
  );
}

export function HelpArticleView({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const locale = useContentLocale();
  const article = getLocalizedHelpArticle(slug, locale);

  if (!article) {
    return (
      <PageFrame maxWidth="3xl">
        <PageEmpty
          headingLevel={1}
          icon="alert"
          title={t('empties.articleNotFound')}
          description={t('helpViewLabels.noHelpPageForSlug', { slug })}
          action={
            <ButtonLink
              className="w-fit"
              to="/help"
              size="sm"
              variant="secondary"
            >
              {t('helpView.backToHelpHub')}
            </ButtonLink>
          }
        />
      </PageFrame>
    );
  }

  const group = helpGroupOf(slug);
  const tone: HelpTone = group?.tone ?? 'blue';
  const toneClasses = TONE_CLASSES[tone];
  const GroupIcon = group ? GROUP_ICONS[group.id] : BookOpenIcon;
  const related = group
    ? localizedArticles(
        group.slugs.filter((other) => other !== slug),
        locale,
      )
    : [];
  const isKeyboard = slug === 'keyboard-shortcuts';
  const toc = isKeyboard
    ? KEYBOARD_NAVIGATION_SECTIONS.map((section) => ({
        heading: t(section.headingKey),
        href: `#${section.id}`,
      }))
    : article.sections.map((section, index) => ({
        heading: section.heading,
        href: `#${sectionId(index)}`,
      }));

  return (
    <PageFrame maxWidth="full" className="max-w-5xl min-w-0 pb-8">
      <PageHeader
        title={article.title}
        back={
          <ButtonLink className="w-fit" to="/help" size="xs" variant="text">
            <ArrowLeftIcon size={14} aria-hidden className="mr-1" />
            {t('helpView.helpCenter')}
          </ButtonLink>
        }
        meta={
          <div className="flex flex-wrap items-center gap-3">
            {group ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  toneClasses.soft,
                  toneClasses.text,
                )}
              >
                <GroupIcon size={13} aria-hidden />
                {t(`helpHub.groups.${group.id}.title`)}
              </span>
            ) : null}
            {article.productionPath ? (
              <ExternalLink
                href={`${PRODUCTION}${article.productionPath}`}
                className="text-foreground-secondary text-xs no-underline underline-offset-2 hover:underline"
              >
                {t('helpHub.openOnTahti', { path: article.productionPath })}
              </ExternalLink>
            ) : null}
            <ContentLanguageToggle />
          </div>
        }
      />

      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border-l-4 p-4',
          toneClasses.border,
          toneClasses.soft,
        )}
      >
        <LightbulbIcon
          size={20}
          aria-hidden
          className={cn('mt-0.5 shrink-0', toneClasses.text)}
        />
        <div>
          <p
            className={cn(
              'text-xs font-bold tracking-[0.14em] uppercase',
              toneClasses.text,
            )}
          >
            {t('helpHub.inShort')}
          </p>
          <p className="mt-1 text-sm leading-relaxed sm:text-base">
            {article.description}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="h-fit lg:sticky lg:top-4">
          <Box variant="tertiary" shadow="default" className="flex-col gap-3">
            <div className="text-sm font-bold">{t('helpView.inThisGuide')}</div>
            <nav
              className="flex flex-col gap-1.5"
              aria-label={t('helpView.articleSections')}
            >
              {toc.map((item, index) => (
                <a
                  key={`${item.heading}-${index}`}
                  href={item.href}
                  className="text-foreground-secondary hover:text-foreground flex items-start gap-2 text-xs leading-relaxed"
                >
                  <span
                    className={cn(
                      'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold',
                      toneClasses.solid,
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{item.heading}</span>
                </a>
              ))}
            </nav>
          </Box>
        </aside>

        <article className="min-w-0">
          <div className="flex flex-col gap-4">
            {isKeyboard ? (
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
                  id={sectionId(index)}
                  variant="tertiary"
                  shadow="default"
                  className={cn(
                    'scroll-mt-4 flex-col gap-3 border-l-4 sm:p-6',
                    toneClasses.border,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'font-display inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold',
                        toneClasses.solid,
                      )}
                    >
                      {index + 1}
                    </span>
                    <h2 className="font-display min-w-0 text-xl font-bold tracking-tight">
                      {section.heading}
                    </h2>
                  </div>
                  {section.body.length > 0 ? (
                    <ul className="flex flex-col gap-2.5 text-sm leading-relaxed">
                      {section.body.map((line) => (
                        <li key={line} className="flex gap-2.5">
                          <CheckCircle2Icon
                            size={17}
                            aria-hidden
                            className={cn('mt-0.5 shrink-0', toneClasses.text)}
                          />
                          <span className="text-foreground-secondary min-w-0">
                            {line}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {section.table ? (
                    <HorizontalScroll label={section.heading} className="mt-1">
                      <DataTable className="min-w-[40rem]">
                        <caption className="sr-only">{section.heading}</caption>
                        <DataTableHead>
                          <DataTableRow>
                            {section.table.columns.map((column) => (
                              <DataTableHeaderCell
                                key={column}
                                className="text-foreground"
                              >
                                {column}
                              </DataTableHeaderCell>
                            ))}
                          </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                          {section.table.rows.map((row) => (
                            <DataTableRow key={row.join('|')}>
                              {row.map((cell, cellIndex) => (
                                <DataTableCell
                                  key={`${row[0]}-${cellIndex}`}
                                  className="text-foreground-secondary leading-relaxed"
                                >
                                  {cell}
                                </DataTableCell>
                              ))}
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTable>
                    </HorizontalScroll>
                  ) : null}
                </Box>
              ))
            )}
          </div>

          {slug === 'support' && (
            <div className="mt-6">
              <SupportCenter />
            </div>
          )}

          {related.length > 0 && (
            <nav
              aria-label={t('helpView.relatedGuides')}
              className="border-border mt-8 border-t pt-5"
            >
              <SectionShell title={t('helpView.relatedGuides')}>
                <ul className="-mx-2 grid gap-1 sm:grid-cols-2">
                  {related.map((item) => (
                    <ArticleLinkRow
                      key={item.slug}
                      article={item}
                      tone={tone}
                    />
                  ))}
                </ul>
              </SectionShell>
            </nav>
          )}
        </article>
      </div>
    </PageFrame>
  );
}
