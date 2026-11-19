import {
  ArrowRightIcon,
  AudioLinesIcon,
  BookOpenIcon,
  CircleDollarSignIcon,
  CompassIcon,
  GitForkIcon,
  MicIcon,
  RadioIcon,
  ScaleIcon,
  UsersIcon,
  VoteIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { ButtonLink, cn } from '@tahti-player/ui';

import { ContentLanguageToggle } from '../components/ContentLanguageToggle';
import { LegalHubLinks } from '../components/LegalHubLinks';
import { PageBackLink } from '../components/PageBackLink';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { PlatformStatsStrip } from '../components/PlatformStatsStrip';
import { TONE_CLASSES, type HelpTone } from '../content/helpUi';
import {
  WHAT_IS_IT_COPY,
  type WhatIsItAudienceId,
  type WhatIsItFeatureId,
} from '../content/whatIsIt';
import { useContentLocale } from '../lib/contentLocale';

const AUDIENCE: Array<{
  id: WhatIsItAudienceId;
  icon: LucideIcon;
  tone: HelpTone;
}> = [
  { id: 'artists', icon: MicIcon, tone: 'red' },
  { id: 'collectives', icon: UsersIcon, tone: 'purple' },
  { id: 'listeners', icon: RadioIcon, tone: 'cyan' },
  { id: 'members', icon: VoteIcon, tone: 'green' },
];

const FEATURES: Array<{
  id: WhatIsItFeatureId;
  icon: LucideIcon;
  tone: HelpTone;
}> = [
  { id: 'broadcast', icon: AudioLinesIcon, tone: 'red' },
  { id: 'catalog', icon: BookOpenIcon, tone: 'blue' },
  { id: 'earn', icon: CircleDollarSignIcon, tone: 'green' },
  { id: 'discover', icon: CompassIcon, tone: 'cyan' },
  { id: 'govern', icon: ScaleIcon, tone: 'orange' },
  { id: 'open', icon: GitForkIcon, tone: 'purple' },
];

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

export function WhatIsItView() {
  const locale = useContentLocale();
  const copy = WHAT_IS_IT_COPY[locale];

  return (
    <PageFrame maxWidth="5xl" className="pb-16">
      <PageHeader
        back={<PageBackLink to="/" label={copy.backLabel} />}
        title={copy.title}
        subtitle={copy.subtitle}
        meta={<ContentLanguageToggle />}
      />

      <section className="border-border from-accent-red/20 via-accent-purple/10 to-accent-cyan/15 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-10">
        <div
          className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[radial-gradient(circle,var(--color-accent-red)_0%,transparent_70%)] opacity-30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 size-64 rounded-full bg-[radial-gradient(circle,var(--color-accent-cyan)_0%,transparent_70%)] opacity-25"
          aria-hidden
        />
        <Eyebrow>{copy.heroEyebrow}</Eyebrow>
        <h2 className="font-display relative mt-2 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          {copy.heroHeading}
        </h2>
        <p className="text-foreground-secondary relative mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          {copy.heroBody}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/join">
            {copy.joinCta}
            <ArrowRightIcon size={15} aria-hidden />
          </ButtonLink>
          <ButtonLink to="/for-artists" variant="secondary">
            {copy.artistsCta}
          </ButtonLink>
          <ButtonLink to="/how-it-works" variant="text">
            {copy.howCta}
          </ButtonLink>
        </div>
      </section>

      <PlatformStatsStrip />

      <section>
        <Eyebrow>{copy.audienceEyebrow}</Eyebrow>
        <SectionTitle>{copy.audienceTitle}</SectionTitle>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {AUDIENCE.map((item) => {
            const text = copy.audience[item.id];
            const tone = TONE_CLASSES[item.tone];
            return (
              <article
                key={item.id}
                className={cn(
                  'border-border bg-background-secondary/50 flex gap-4 rounded-xl border border-l-4 p-5',
                  tone.border,
                )}
              >
                <IconBadge icon={item.icon} tone={item.tone} />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    {text.title}
                  </h3>
                  <p className="text-foreground-secondary mt-1 text-sm leading-relaxed">
                    {text.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-border bg-background-secondary/30 rounded-2xl border p-6 sm:p-8">
        <Eyebrow>{copy.doesEyebrow}</Eyebrow>
        <SectionTitle>{copy.doesTitle}</SectionTitle>
        <p className="text-foreground-secondary mt-3 max-w-3xl text-sm leading-relaxed sm:text-base">
          {copy.doesLead}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {copy.doesPoints.map((point, index) => (
            <div
              key={point.title}
              className="border-border bg-background flex flex-col gap-2 rounded-xl border p-4"
            >
              <span className="text-primary-strong font-mono text-xs font-semibold tracking-[0.18em] uppercase">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-base font-bold tracking-tight">
                {point.title}
              </h3>
              <p className="text-foreground-secondary text-sm leading-relaxed">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>{copy.featuresEyebrow}</Eyebrow>
        <SectionTitle>{copy.featuresTitle}</SectionTitle>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const text = copy.features[feature.id];
            const tone = TONE_CLASSES[feature.tone];
            return (
              <article
                key={feature.id}
                className={cn(
                  'border-border bg-background-secondary/50 flex flex-col gap-3 rounded-xl border border-t-4 p-5',
                  tone.border,
                )}
              >
                <div className="flex items-center gap-3">
                  <IconBadge icon={feature.icon} tone={feature.tone} />
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
                      <span
                        className={cn(
                          'mt-1.5 size-1.5 shrink-0 rounded-full bg-current',
                          tone.text,
                        )}
                        aria-hidden
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <Eyebrow>{copy.moneyEyebrow}</Eyebrow>
        <SectionTitle>{copy.moneyTitle}</SectionTitle>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {copy.moneyStats.map((stat) => (
            <div
              key={stat.label}
              className="border-border bg-background-secondary/50 rounded-xl border p-4 text-center"
            >
              <div className="font-display text-primary-strong text-3xl font-bold">
                {stat.value}
              </div>
              <div className="text-foreground-secondary mt-1 text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-foreground-secondary mt-4 max-w-3xl text-sm leading-relaxed">
          {copy.moneyBody}
        </p>
      </section>

      <section className="border-border rounded-2xl border p-6 sm:p-8">
        <Eyebrow>{copy.principlesEyebrow}</Eyebrow>
        <SectionTitle>{copy.principlesTitle}</SectionTitle>
        <ol className="mt-5 flex flex-col gap-4">
          {copy.principles.map((principle, index) => (
            <li key={principle} className="flex gap-4">
              <span className="bg-primary text-primary-foreground font-display flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                {index + 1}
              </span>
              <p className="text-foreground pt-1.5 text-sm leading-relaxed sm:text-base">
                {principle}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/about" variant="secondary" size="sm">
            {copy.aboutLink}
          </ButtonLink>
          <ButtonLink to="/transparency" variant="text" size="sm">
            {copy.transparencyLink}
          </ButtonLink>
          <ButtonLink to="/governance" variant="text" size="sm">
            {copy.governanceLink}
          </ButtonLink>
        </div>
      </section>

      <section className="border-primary/40 from-primary/10 to-accent-purple/10 rounded-2xl border bg-gradient-to-br p-6 text-center sm:p-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {copy.closingTitle}
        </h2>
        <p className="text-foreground-secondary mx-auto mt-3 max-w-xl text-sm leading-relaxed">
          {copy.closingBody}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/join">
            {copy.joinCta}
            <ArrowRightIcon size={16} aria-hidden />
          </ButtonLink>
          <ButtonLink to="/for-artists" variant="secondary">
            {copy.artistsCta}
          </ButtonLink>
        </div>
      </section>

      <LegalHubLinks />
    </PageFrame>
  );
}
