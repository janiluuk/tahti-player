import { Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  AudioLinesIcon,
  BadgeCheckIcon,
  CircleDollarSignIcon,
  DownloadIcon,
  EyeOffIcon,
  FileJson2Icon,
  GaugeIcon,
  GitForkIcon,
  MailIcon,
  MicIcon,
  MinusIcon,
  PaletteIcon,
  PlayCircleIcon,
  RadioIcon,
  ScaleIcon,
  ScissorsIcon,
  ServerIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
  VoteIcon,
  Wand2Icon,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { LegalHubLinks } from '../components/LegalHubLinks';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { getLegalPage } from '../content/legal';

const detail = getLegalPage('what-is-it');

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-primary font-mono text-xs font-semibold tracking-[0.2em] uppercase">
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

function Card({
  icon: Icon,
  title,
  children,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  tone?: 'primary' | 'secondary';
}) {
  return (
    <div className="border-border bg-background-secondary/50 rounded-xl border p-4">
      <span
        className={
          tone === 'primary'
            ? 'bg-primary text-primary-foreground mb-3 inline-flex size-8 items-center justify-center rounded-lg'
            : 'bg-secondary text-secondary-foreground mb-3 inline-flex size-8 items-center justify-center rounded-lg'
        }
      >
        <Icon size={16} aria-hidden />
      </span>
      <h3 className="font-display text-base font-bold tracking-tight">
        {title}
      </h3>
      <p className="text-foreground-secondary mt-1 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-border bg-background-secondary/50 rounded-xl border p-4 text-center">
      <div className="font-display text-primary text-3xl font-bold">
        {value}
      </div>
      <div className="text-foreground-secondary mt-1 text-xs">{label}</div>
    </div>
  );
}

const FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: PlayCircleIcon,
    title: 'Auto-record & schedule',
    body: 'Every show captured — publish now or later.',
  },
  {
    icon: MicIcon,
    title: 'Green room → live',
    body: 'Check your levels off-air, then go on.',
  },
  {
    icon: AudioLinesIcon,
    title: 'Audio editor',
    body: 'Effects and plug-ins, right in the browser.',
  },
  {
    icon: ScissorsIcon,
    title: 'Stem splitting',
    body: 'Pull clean stems from a mix in one click.',
  },
  {
    icon: ArrowRightIcon,
    title: 'Embed anything',
    body: 'Channel, release, or show — embeddable anywhere.',
  },
  {
    icon: DownloadIcon,
    title: 'Import / export',
    body: 'SoundCloud, Bandcamp, hearthis.at, and more.',
  },
  {
    icon: PaletteIcon,
    title: 'Your channel, your rules',
    body: 'Design and control it top to bottom.',
  },
  {
    icon: ServerIcon,
    title: 'Private stash',
    body: 'Your own storage — keep it private or sell access.',
  },
  {
    icon: MailIcon,
    title: 'Talk to fans',
    body: 'Live chat and private messaging, built in.',
  },
  {
    icon: FileJson2Icon,
    title: 'Newsletter & press kit',
    body: 'Reach listeners directly, and look the part.',
  },
  {
    icon: VoteIcon,
    title: 'Discuss & vote',
    body: 'Member proposals shape the roadmap.',
  },
  {
    icon: UsersIcon,
    title: 'Moderators',
    body: 'Run a shared channel together, as a crew.',
  },
];

const HONESTY_CARDS: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: MinusIcon,
    title: 'Passive earns nothing',
    body: 'The classic bot-farm trick — streams left running — simply does not pay here.',
  },
  {
    icon: DownloadIcon,
    title: 'Counted once',
    body: 'Downloads count once per account, with rate limits.',
  },
  {
    icon: GaugeIcon,
    title: 'Pattern detection',
    body: 'Real fandom is messy; fake activity is too tidy. This layer is being built next.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Always a human',
    body: 'Nothing docked silently. Anomalies are flagged, the artist is told, and there is a right of appeal.',
  },
];

const GUARANTEES: Array<{ when: string; then: string }> = [
  {
    when: 'If prices ever crept up',
    then: 'fork it and run it your way',
  },
  {
    when: 'If ads or data-selling slipped in',
    then: 'the constitution forbids it — public source can’t hide it',
  },
  {
    when: 'If we were sold, or folded',
    then: 'the platform lives on; export everything',
  },
  {
    when: 'If a feature you rely on was removed',
    then: 'keep it alive in a fork',
  },
];

const HELSINKI_CARDS: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: ServerIcon,
    title: 'Our own hardware',
    body: "In Helsinki, with UpCloud's Helsinki region for overflow — no third-party CDN.",
  },
  {
    icon: EyeOffIcon,
    title: 'No account to listen',
    body: 'No analytics cookies; identifiers hashed and rotated daily.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'No data to sell',
    body: "We don't collect it in a form that would let us.",
  },
  {
    icon: BadgeCheckIcon,
    title: 'No vanity metrics',
    body: 'Our constitution bars listener-hours as a headline number.',
  },
];

const RISKS: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: UsersIcon,
    title: 'Stay small',
    body: 'Why we start with real communities, not the void.',
  },
  {
    icon: CircleDollarSignIcon,
    title: 'Funding timing',
    body: 'Break-even ≈ 600 members; year one runs a planned deficit on a founding grant.',
  },
  {
    icon: ScaleIcon,
    title: 'Small team',
    body: 'Succession and an artist-majority board are written in from day one.',
  },
  {
    icon: Wand2Icon,
    title: "We'll err",
    body: 'You hear it from us first — and vote on the fix.',
  },
  {
    icon: ServerIcon,
    title: 'Infrastructure',
    body: 'A capacity upgrade arrives with the growth that pays for it.',
  },
];

const TIMELINE: Array<{ when: string; what: string; now?: boolean }> = [
  { when: 'NOW', what: 'Beta live', now: true },
  { when: 'WEEKS', what: 'New interface' },
  { when: 'NEXT', what: 'Invite round' },
  { when: 'END SEPT', what: 'Public launch' },
];

export function WhatIsItView() {
  return (
    <PageFrame maxWidth="5xl" className="pb-16">
      <PageHeader
        title="What is tahti.live"
        subtitle="Nonprofit broadcasting for independent artists — built to support artists, not algorithms."
      />

      {/* Hero */}
      <section className="border-border bg-background-secondary/30 rounded-2xl border p-6 sm:p-10">
        <Eyebrow>On air · beta live</Eyebrow>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          A home for your music, and your live shows.
        </h1>
        <p className="text-foreground-secondary mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
          You make the music. We take care of the rest — the tedious, mechanical
          work automated, drawn from two decades in streaming.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/join"
            className="bg-primary text-primary-foreground inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-semibold"
          >
            Join the beta
            <ArrowRightIcon size={15} aria-hidden />
          </Link>
          <Link
            to="/for-artists"
            className="border-border hover:bg-background-secondary inline-flex h-9 items-center gap-1.5 rounded-md border px-4 text-sm font-semibold transition-colors"
          >
            Tahti for artists
          </Link>
        </div>
      </section>

      {/* Thesis */}
      <section>
        <Eyebrow>What we are</Eyebrow>
        <SectionTitle>Two things at once.</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="border-border bg-background-secondary/50 rounded-xl border p-5">
            <div className="text-foreground-secondary font-mono text-xs tracking-widest uppercase">
              Release system
            </div>
            <div className="font-display text-secondary-foreground mt-2 text-lg font-bold">
              A real discography &amp; release engine
            </div>
          </div>
          <div className="border-border bg-background-secondary/50 rounded-xl border p-5">
            <div className="text-foreground-secondary font-mono text-xs tracking-widest uppercase">
              Broadcast
            </div>
            <div className="font-display mt-2 text-lg font-bold">
              A proper live platform for performers
            </div>
          </div>
        </div>
      </section>

      {/* Broadcasting */}
      <section>
        <Eyebrow>Built for broadcasters</Eyebrow>
        <SectionTitle>Live is the heart of it.</SectionTitle>
        <p className="text-foreground-secondary mt-3 max-w-2xl text-sm leading-relaxed">
          The music never stops between shows — past sets and community-chosen
          tracks keep the signal live, so dead air never gets a slot.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <div className="flex flex-wrap gap-1.5">
            <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
              OBS
            </span>
            <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
              Mixxx
            </span>
            <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
              Traktor
            </span>
            <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
              browser
            </span>
          </div>
          <ArrowRightIcon
            size={16}
            aria-hidden
            className="text-foreground-secondary"
          />
          <div className="border-border rounded-lg border px-3 py-2 text-center">
            <div className="font-display text-sm font-bold">
              Green room → live
            </div>
          </div>
          <ArrowRightIcon
            size={16}
            aria-hidden
            className="text-foreground-secondary"
          />
          <div className="border-accent-red/40 bg-accent-red/10 rounded-lg border px-3 py-2 text-center">
            <div className="font-display text-accent-red text-sm font-bold">
              Tahti Radio
            </div>
          </div>
          <ArrowRightIcon
            size={16}
            aria-hidden
            className="text-foreground-secondary"
          />
          <div className="flex flex-wrap gap-1.5">
            <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
              Twitch
            </span>
            <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
              YouTube
            </span>
            <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
              Kick
            </span>
          </div>
        </div>
      </section>

      {/* Quality */}
      <section className="border-border bg-background-secondary/30 rounded-2xl border p-6 text-center">
        <Eyebrow>For listeners</Eyebrow>
        <SectionTitle>Free listeners hear the real thing.</SectionTitle>
        <p className="text-foreground-secondary mx-auto mt-3 max-w-xl text-sm leading-relaxed">
          A free listener on a member&rsquo;s channel hears the same{' '}
          <strong className="text-foreground">lossless FLAC</strong> the artist
          streams — no pay-to-hear-it-properly. Free-tier artists broadcast at
          192 kbps MP3, still cleaner than most platforms give away.
        </p>
      </section>

      {/* Feature grid */}
      <section>
        <Eyebrow>The toolset</Eyebrow>
        <SectionTitle>Everything in one place.</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} icon={f.icon} title={f.title}>
              {f.body}
            </Card>
          ))}
        </div>
        <p className="text-foreground-secondary mt-3 text-center font-mono text-xs">
          Most of these are add-ons — turn on only what fits how you work.
        </p>
      </section>

      {/* Money flow */}
      <section>
        <Eyebrow>Where the money goes</Eyebrow>
        <SectionTitle>It&rsquo;s tipped your way — by design.</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value="98%" label="of a fan-sub euro → you" />
          <Stat value="90%" label="of annual surplus → artist grants" />
          <Stat value="2%" label="ops fee (card + support)" />
          <Stat value="0%" label="platform cut, always" />
        </div>
      </section>

      {/* Engagement */}
      <section>
        <Eyebrow>How you get paid</Eyebrow>
        <SectionTitle>Count your stars.</SectionTitle>
        <div className="border-border mt-4 max-w-xl divide-y rounded-xl border">
          {[
            {
              name: 'Fan-sub euro',
              meta: 'a real person, paying you',
              stars: 5,
            },
            {
              name: 'A download',
              meta: 'a deliberate act, once per account',
              stars: 1,
            },
            {
              name: 'Background play',
              meta: 'music left running',
              stars: 0,
            },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <div className="font-display text-sm font-bold">{row.name}</div>
                <div className="text-foreground-secondary text-xs">
                  {row.meta}
                </div>
              </div>
              <div className="flex gap-0.5" aria-label={`${row.stars} of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon
                    key={i}
                    size={16}
                    aria-hidden
                    className={
                      i < row.stars
                        ? 'fill-primary text-primary'
                        : 'text-border'
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-foreground-secondary mt-3 max-w-xl text-sm">
          Give it away or sell it — both win. Only doing nothing earns nothing.
        </p>
      </section>

      {/* Honesty */}
      <section>
        <Eyebrow>Keeping it honest</Eyebrow>
        <SectionTitle>Hard to game, by construction.</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {HONESTY_CARDS.map((c) => (
            <Card key={c.title} icon={c.icon} title={c.title}>
              {c.body}
            </Card>
          ))}
        </div>
      </section>

      {/* Open source */}
      <section>
        <Eyebrow>Open by design</Eyebrow>
        <SectionTitle>Open source, all of it.</SectionTitle>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <p className="text-foreground-secondary">
            <strong className="text-foreground">
              The code we run is public
            </strong>{' '}
            — under AGPL, and every page links to its own source.
          </p>
          <p className="text-foreground-secondary">
            <strong className="text-foreground">We welcome forks</strong> — not
            just tolerate them.
          </p>
          <p className="text-foreground-secondary">
            <strong className="text-foreground">No lock-in.</strong> Your
            releases, archive, and fan records export any time.
          </p>
        </div>
        <Link
          to="/agpl"
          className="mt-3 inline-flex items-center gap-1 text-sm underline-offset-2 hover:underline"
        >
          <GitForkIcon size={14} aria-hidden />
          Source code &amp; AGPL licence →
        </Link>
      </section>

      {/* Guarantee */}
      <section>
        <Eyebrow>The guarantee</Eyebrow>
        <SectionTitle>It can never be turned against you.</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {GUARANTEES.map((g) => (
            <div
              key={g.when}
              className="border-border bg-background-secondary/50 rounded-xl border p-4"
            >
              <div className="text-accent-red font-mono text-xs tracking-widest uppercase">
                {g.when}
              </div>
              <div className="font-display mt-1 text-sm font-bold">
                → {g.then}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Helsinki */}
      <section>
        <Eyebrow>Rooted in Helsinki</Eyebrow>
        <SectionTitle>Finnish nonprofit, Finnish infrastructure.</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {HELSINKI_CARDS.map((c) => (
            <Card key={c.title} icon={c.icon} title={c.title}>
              {c.body}
            </Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section>
        <Eyebrow>Plans</Eyebrow>
        <SectionTitle>Free to listen. €40 a year to be an artist.</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="border-border rounded-xl border p-5">
            <div className="text-foreground-secondary font-mono text-xs tracking-widest uppercase">
              Free · everyone
            </div>
            <div className="font-display mt-1 text-3xl font-bold">€0</div>
            <ul className="text-foreground-secondary mt-3 flex flex-col gap-1.5 text-sm">
              <li>Full lossless on member channels</li>
              <li>Follow, live chat, support artists</li>
              <li>Start a channel — ~1 hr/week live @ 192 kbps</li>
            </ul>
          </div>
          <div className="border-primary/50 bg-primary/5 rounded-xl border p-5">
            <div className="text-primary font-mono text-xs tracking-widest uppercase">
              Artist membership
            </div>
            <div className="font-display mt-1 text-3xl font-bold">
              €40
              <span className="text-foreground-secondary text-sm font-normal">
                {' '}
                / year
              </span>
            </div>
            <ul className="text-foreground-secondary mt-3 flex flex-col gap-1.5 text-sm">
              <li>Lossless FLAC broadcast — you and your listeners</li>
              <li>No weekly airtime cap</li>
              <li>Full release + distribution, own space &amp; design</li>
              <li>Newsletter, DMs, storage</li>
              <li>A vote at the AGM</li>
            </ul>
            <p className="text-foreground-secondary mt-3 text-xs">
              Funds the grant pool and keeps the lights on — it isn&rsquo;t a
              premium tier.
            </p>
          </div>
        </div>
      </section>

      {/* Funding */}
      <section>
        <Eyebrow>How we&rsquo;re funded</Eyebrow>
        <SectionTitle>The cleanest possible money.</SectionTitle>
        <p className="text-foreground-secondary mt-3 max-w-2xl text-sm leading-relaxed">
          Member subscriptions, direct fan support, and cultural grants. No VC,
          no equity, no exit — it&rsquo;s written into the constitution.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat value="~200" label="members · year one (planned deficit)" />
          <Stat value="~600" label="members · break-even" />
          <Stat value="1,500+" label="members · grant pool grows" />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
            Finnish Cultural Foundation
          </span>
          <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
            Kone Foundation
          </span>
          <span className="border-border bg-background-secondary rounded-md border px-2 py-1 font-mono text-xs">
            Creative Europe
          </span>
        </div>
      </section>

      {/* Governance */}
      <section>
        <Eyebrow>Governance</Eyebrow>
        <SectionTitle>
          Not a company you upload to — an association you own.
        </SectionTitle>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <p className="text-foreground-secondary">
            <strong className="text-foreground">One member, one vote.</strong>{' '}
            Proposals run continuously; formal decisions at the AGM.
          </p>
          <p className="text-foreground-secondary">
            <strong className="text-foreground">Core promises locked</strong> —
            no cut of fan support, no data sold, no ads — changeable only by a
            two-thirds vote, 60 days&rsquo; notice.
          </p>
          <p className="text-foreground-secondary">
            <strong className="text-foreground">
              No exit, no shareholders.
            </strong>{' '}
            Surplus flows to artists; the board becomes artist-majority as it
            matures.
          </p>
        </div>
        <Link
          to="/governance"
          className="mt-3 inline-flex items-center gap-1 text-sm underline-offset-2 hover:underline"
        >
          Governance &amp; the AGM →
        </Link>
      </section>

      {/* Transparency */}
      <section>
        <Eyebrow>Transparency</Eyebrow>
        <SectionTitle>The books are open.</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card icon={FileJson2Icon} title="Public bylaws">
            The rules aren&rsquo;t buried — they&rsquo;re published.
          </Card>
          <Card icon={CircleDollarSignIcon} title="Monthly ledger">
            Append-only and audited — not a once-a-year PDF.
          </Card>
          <Card icon={UsersIcon} title="Salaries public">
            What we pay the people running it is on the record.
          </Card>
          <Card icon={RadioIcon} title="Grant pool in the open">
            Runs on the same public ledger.
          </Card>
        </div>
        <Link
          to="/transparency"
          className="mt-3 inline-flex items-center gap-1 text-sm underline-offset-2 hover:underline"
        >
          Transparency ledger →
        </Link>
      </section>

      {/* Timeline */}
      <section>
        <Eyebrow>Roadmap</Eyebrow>
        <SectionTitle>Already running — not a someday project.</SectionTitle>
        <div className="mt-6 flex gap-0">
          {TIMELINE.map((step) => (
            <div
              key={step.when}
              className="border-border relative flex-1 border-t-2 pt-4 text-center"
            >
              <span
                className={
                  step.now
                    ? 'bg-accent-red border-accent-red absolute -top-[7px] left-1/2 size-3 -translate-x-1/2 rounded-full border-2'
                    : 'bg-background-secondary border-border absolute -top-[7px] left-1/2 size-3 -translate-x-1/2 rounded-full border-2'
                }
                aria-hidden
              />
              <div className="text-foreground-secondary font-mono text-[11px] tracking-widest uppercase">
                {step.when}
              </div>
              <div
                className={
                  step.now
                    ? 'text-accent-red font-display mt-1 text-sm font-bold'
                    : 'font-display mt-1 text-sm font-bold'
                }
              >
                {step.what}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Risks */}
      <section>
        <Eyebrow>Honest risks</Eyebrow>
        <SectionTitle>What could go wrong — and our answer.</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RISKS.map((r) => (
            <Card key={r.title} icon={r.icon} title={r.title}>
              {r.body}
            </Card>
          ))}
        </div>
        <p className="text-foreground-secondary mt-3 text-sm">
          The promise isn&rsquo;t perfection — it&rsquo;s that the promises are
          constitutional.
        </p>
      </section>

      {/* Close */}
      <section className="border-primary/40 bg-primary/5 rounded-2xl border p-6 text-center sm:p-10">
        <Eyebrow>Invite round opens soon</Eyebrow>
        <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          You won&rsquo;t be a user here.
          <br />
          <span className="text-primary">You&rsquo;ll be a member.</span>
        </h2>
        <p className="text-foreground-secondary mx-auto mt-3 max-w-xl text-sm leading-relaxed">
          One member, one vote — you help decide what we build next. The beta is
          running now; join the first wave of artists, set up your channel, and
          run a show.
        </p>
        <Link
          to="/join"
          className="bg-primary text-primary-foreground mt-5 inline-flex h-10 items-center gap-1.5 rounded-md px-5 text-sm font-semibold"
        >
          Join the beta
          <ArrowRightIcon size={16} aria-hidden />
        </Link>
      </section>

      {/* Full detail (prose) */}
      {detail && (
        <section className="border-border flex flex-col gap-6 border-t pt-8">
          <div>
            <Eyebrow>In depth</Eyebrow>
            <SectionTitle>Every detail, no slides.</SectionTitle>
          </div>
          {detail.sections.map((s) => (
            <div key={s.heading} className="flex flex-col gap-2">
              <h3 className="font-display text-lg font-bold tracking-tight">
                {s.heading}
              </h3>
              {s.paragraphs.map((p) => (
                <p
                  key={p.slice(0, 48)}
                  className="text-foreground-secondary text-sm leading-relaxed"
                >
                  {p}
                </p>
              ))}
            </div>
          ))}
        </section>
      )}

      <LegalHubLinks />
    </PageFrame>
  );
}
