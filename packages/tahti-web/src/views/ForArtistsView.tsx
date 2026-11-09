import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  CodeIcon,
  DiscIcon,
  EyeIcon,
  LaptopIcon,
  MicIcon,
  PaletteIcon,
  TerminalIcon,
  VoteIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { ButtonLink, cn } from '@tahti-player/ui';

import { ContentLanguageToggle } from '../components/ContentLanguageToggle';
import { LegalHubLinks } from '../components/LegalHubLinks';
import { PageBackLink } from '../components/PageBackLink';
import { PageFrame, PageHeader } from '../components/PageHeader';
import {
  FOR_ARTISTS_COPY,
  type ForArtistsPillarId,
} from '../content/forArtists';
import { TONE_CLASSES, type HelpTone } from '../content/helpUi';
import { useContentLocale } from '../lib/contentLocale';

const PILLARS: Array<{
  id: ForArtistsPillarId;
  icon: LucideIcon;
  tone: HelpTone;
}> = [
  { id: 'live', icon: MicIcon, tone: 'red' },
  { id: 'publish', icon: DiscIcon, tone: 'blue' },
  { id: 'program', icon: CalendarClockIcon, tone: 'cyan' },
  { id: 'design', icon: PaletteIcon, tone: 'purple' },
  { id: 'earn', icon: CircleDollarSignIcon, tone: 'green' },
  { id: 'grow', icon: BarChart3Icon, tone: 'orange' },
];

const STEP_TONES: HelpTone[] = ['blue', 'purple', 'red'];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-primary-strong font-mono text-xs font-semibold tracking-[0.2em] uppercase">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}

function IconBadge({ icon: Icon, tone }: { icon: LucideIcon; tone: HelpTone }) {
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-xl',
        TONE_CLASSES[tone].solid,
      )}
    >
      <Icon size={20} aria-hidden />
    </span>
  );
}

export function ForArtistsView() {
  const locale = useContentLocale();
  const copy = FOR_ARTISTS_COPY[locale];

  const anywhere = [
    { ...copy.anywhere.apps, icon: LaptopIcon, tone: 'blue' as const },
    { ...copy.anywhere.cli, icon: TerminalIcon, tone: 'purple' as const },
  ];
  const community = [
    { ...copy.community.vote, icon: VoteIcon, tone: 'green' as const },
    { ...copy.community.open, icon: EyeIcon, tone: 'cyan' as const },
    { ...copy.community.source, icon: CodeIcon, tone: 'orange' as const },
  ];

  return (
    <PageFrame maxWidth="5xl" className="pb-16">
      <PageHeader
        back={<PageBackLink to="/what-is-it" label={copy.backLabel} />}
        title={copy.title}
        subtitle={copy.subtitle}
        meta={<ContentLanguageToggle />}
      />

      <section className="border-border from-accent-red/15 via-accent-purple/10 to-accent-blue/15 rounded-2xl border bg-gradient-to-br p-6 sm:p-10">
        <Eyebrow>{copy.heroEyebrow}</Eyebrow>
        <h2 className="font-display mt-2 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          {copy.heroHeading}
        </h2>
        <p className="text-foreground-secondary mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          {copy.heroBody}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/join">
            {copy.startCta}
            <ArrowRightIcon size={15} aria-hidden />
          </ButtonLink>
          <ButtonLink
            to="/help/$slug"
            params={{ slug: 'for-artists' }}
            variant="secondary"
          >
            {copy.guideCta}
          </ButtonLink>
        </div>
      </section>

      <section>
        <Eyebrow>{copy.pillarsEyebrow}</Eyebrow>
        <SectionTitle>{copy.pillarsTitle}</SectionTitle>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => {
            const text = copy.pillars[pillar.id];
            const tone = TONE_CLASSES[pillar.tone];
            return (
              <article
                key={pillar.id}
                className={cn(
                  'border-border bg-background-secondary/50 flex flex-col gap-3 rounded-xl border border-t-4 p-5',
                  tone.border,
                )}
              >
                <div className="flex items-center gap-3">
                  <IconBadge icon={pillar.icon} tone={pillar.tone} />
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    {text.title}
                  </h3>
                </div>
                <p className={cn('text-sm font-semibold', tone.text)}>
                  {text.lead}
                </p>
                <ul className="text-foreground-secondary flex flex-col gap-2 text-sm leading-relaxed">
                  {text.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <CheckCircle2Icon
                        size={16}
                        aria-hidden
                        className={cn('mt-0.5 shrink-0', tone.text)}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <Eyebrow>{copy.stepsEyebrow}</Eyebrow>
        <SectionTitle>{copy.stepsTitle}</SectionTitle>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {copy.steps.map((step, index) => {
            const tone = TONE_CLASSES[STEP_TONES[index] ?? 'blue'];
            return (
              <li
                key={step.title}
                className={cn('flex flex-col gap-2 rounded-xl p-5', tone.soft)}
              >
                <span
                  className={cn(
                    'font-display inline-flex size-10 items-center justify-center rounded-full text-lg font-extrabold',
                    tone.solid,
                  )}
                >
                  {index + 1}
                </span>
                <h3 className="font-display text-base font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-foreground-secondary text-sm leading-relaxed">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Eyebrow>{copy.anywhereEyebrow}</Eyebrow>
          <SectionTitle>{copy.anywhereTitle}</SectionTitle>
        </div>
        {anywhere.map((item) => (
          <div
            key={item.title}
            className="border-border bg-background-secondary/50 flex gap-4 rounded-xl border p-5"
          >
            <IconBadge icon={item.icon} tone={item.tone} />
            <div>
              <h3 className="font-display text-base font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="text-foreground-secondary mt-1 text-sm leading-relaxed">
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="border-border bg-background-secondary/30 rounded-2xl border p-6 sm:p-8">
        <Eyebrow>{copy.communityEyebrow}</Eyebrow>
        <SectionTitle>{copy.communityTitle}</SectionTitle>
        <p className="text-foreground-secondary mt-3 max-w-2xl text-sm leading-relaxed">
          {copy.communityBody}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {community.map((item) => (
            <div key={item.title} className="flex gap-3">
              <IconBadge icon={item.icon} tone={item.tone} />
              <div>
                <h3 className="font-display text-base font-bold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-foreground-secondary mt-1 text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {copy.closingTitle}
          </h2>
          <p className="mt-1 text-sm opacity-85">{copy.closingBody}</p>
        </div>
        <ButtonLink to="/join" variant="secondary">
          {copy.startCta}
          <ArrowRightIcon size={15} aria-hidden />
        </ButtonLink>
      </section>

      <LegalHubLinks />
    </PageFrame>
  );
}
