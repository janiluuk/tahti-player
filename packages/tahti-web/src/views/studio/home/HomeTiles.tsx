import { Link } from '@tanstack/react-router';
import { type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

import { useSkipEnterMotion } from '@tahti-player/ui';

import { Eyebrow } from '../../../components/tahti/Eyebrow';

const STUDIO_HOME_TILES_STAGGER_KEY = 'tahti-studio-home-tiles-staggered';

const tileStaggerContext = createContext(false);

const tileStaggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const tileStaggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 420, damping: 32 },
  },
};

export function HomeTileStagger({ children }: PropsWithChildren) {
  const reducedMotion = useSkipEnterMotion();
  const [skipEnter] = useState(() => {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }
    return sessionStorage.getItem(STUDIO_HOME_TILES_STAGGER_KEY) === '1';
  });

  useEffect(() => {
    if (reducedMotion || skipEnter) {
      return;
    }
    sessionStorage.setItem(STUDIO_HOME_TILES_STAGGER_KEY, '1');
  }, [reducedMotion, skipEnter]);

  if (reducedMotion || skipEnter) {
    return <div className="flex flex-col gap-8">{children}</div>;
  }

  return (
    <tileStaggerContext.Provider value>
      <motion.div
        className="flex flex-col gap-8"
        variants={tileStaggerContainer}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    </tileStaggerContext.Provider>
  );
}

function HomeTileStaggerWrap({ children }: PropsWithChildren) {
  const stagger = useContext(tileStaggerContext);
  if (!stagger) {
    return children;
  }
  return <motion.div variants={tileStaggerItem}>{children}</motion.div>;
}

export function Group({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2>
        <Eyebrow>{title}</Eyebrow>
      </h2>
      {children}
    </section>
  );
}

/** Theme accent tokens as Tailwind bg classes — inline `var(--accent-*)`
 * fills broke in e2e journey screenshots when a theme injection omitted
 * the bare aliases; these map through `@theme` / global.css. */
export type StudioTileAccent =
  | 'bg-accent-purple'
  | 'bg-accent-orange'
  | 'bg-accent-green'
  | 'bg-accent-yellow'
  | 'bg-accent-blue'
  | 'bg-accent-cyan'
  | 'bg-accent-red'
  | 'bg-primary';

/** Colour-coded, icon-first nav tile — the label sits in a translucent
 * strip over the icon (opacity layer) so it stays legible regardless of
 * the tile's background colour, instead of plain text below an artwork
 * square like the music Card component. */
export function StudioActionTile({
  to,
  icon: Icon,
  label,
  subtitle,
  color,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  color: StudioTileAccent;
}) {
  return (
    <HomeTileStaggerWrap>
      <Link
        to={to}
        className={`group border-border relative flex aspect-[4/3] flex-col overflow-hidden rounded-xl border shadow-sm transition-transform hover:-translate-y-0.5 ${color}`}
      >
        <div className="relative z-10 bg-black/45 px-3 py-2 backdrop-blur-sm">
          <div className="truncate text-sm font-bold text-white">{label}</div>
          {subtitle ? (
            <div className="truncate text-[11px] text-white/75">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Icon
            size={40}
            absoluteStrokeWidth
            strokeWidth={1.5}
            className="text-white/90 transition-transform group-hover:scale-110"
            aria-hidden
          />
        </div>
      </Link>
    </HomeTileStaggerWrap>
  );
}

export type CompactBroadcastTileProps = {
  to: '/studio/go-live' | '/studio/schedule';
  icon: LucideIcon;
  label: string;
  subtitle: string;
  color: StudioTileAccent;
};

export const CompactBroadcastTile: FC<CompactBroadcastTileProps> = ({
  to,
  icon: Icon,
  label,
  subtitle,
  color,
}) => (
  <HomeTileStaggerWrap>
    <Link
      to={to}
      data-testid="compact-broadcast-card"
      className="border-border bg-background-secondary/40 hover:bg-background-secondary group flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-white ${color}`}
      >
        <Icon size={22} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        <span className="text-foreground-secondary block truncate text-xs">
          {subtitle}
        </span>
      </span>
    </Link>
  </HomeTileStaggerWrap>
);

export type SummaryStatProps = {
  label: string;
  value: number;
  note: string;
  icon: LucideIcon;
};

export const SummaryStat: FC<SummaryStatProps> = ({
  label,
  value,
  note,
  icon: Icon,
}) => (
  <HomeTileStaggerWrap>
    <Link
      to="/studio/stats"
      aria-label={`${value.toLocaleString()} ${label.toLowerCase()}`}
      className="border-border bg-background-secondary/35 hover:bg-background-secondary group flex min-w-0 flex-col gap-2 rounded-xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <span className="text-foreground-secondary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        <Icon size={15} aria-hidden className="text-primary-strong" />
        {label}
      </span>
      <span className="font-display text-2xl font-extrabold tabular-nums">
        {value.toLocaleString()}
      </span>
      <span className="text-foreground-secondary text-xs">{note}</span>
    </Link>
  </HomeTileStaggerWrap>
);
