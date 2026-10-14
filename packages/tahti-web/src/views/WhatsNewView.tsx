import { Link } from '@tanstack/react-router';
import { SparklesIcon } from 'lucide-react';

import { cn, ViewShell } from '@tahti-player/ui';

import { RELEASE_NOTES, type ReleaseNote } from '../content/releaseNotes';

function TimelineNode({ isLatest }: { isLatest?: boolean }) {
  return isLatest ? (
    <div className="bg-accent-green border-foreground flex size-7 shrink-0 items-center justify-center rounded-full border-(length:--border-width)">
      <SparklesIcon className="text-foreground size-4" strokeWidth={2.5} />
    </div>
  ) : (
    <div className="bg-foreground border-foreground size-5 shrink-0 rounded-full border-(length:--border-width)">
      <div className="bg-background-secondary border-background-secondary size-full rounded-full border-(length:--border-width)">
        <div className="bg-foreground size-full rounded-full" />
      </div>
    </div>
  );
}

function ReleaseEntry({
  note,
  isFirst,
  isLast,
}: {
  note: ReleaseNote;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div data-testid="release-note-entry" className="flex gap-3 sm:gap-4">
      <div className="flex w-7 shrink-0 flex-col items-center gap-1">
        <div
          className={cn(
            'w-1 flex-1 rounded-b-full',
            isFirst ? 'bg-transparent' : 'bg-border',
          )}
        />
        <TimelineNode isLatest={isFirst} />
        <div
          className={cn(
            'w-1 flex-1 rounded-t-full',
            isLast ? 'bg-transparent' : 'bg-border',
          )}
        />
      </div>
      <div className="my-4 flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-foreground-secondary text-xs font-medium">
            Version {note.version}
          </span>
          <span className="text-foreground-secondary text-xs">
            {new Date(note.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="border-border bg-background-secondary shadow-shadow flex-1 overflow-hidden rounded-md border-(length:--border-width)">
          <ul className="flex list-disc flex-col gap-1.5 p-3 pl-7 text-sm sm:p-4 sm:pl-8">
            {note.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Release notes timeline — embeddable under Settings. */
export function WhatsNewPanel() {
  return (
    <div className="flex w-full flex-col">
      <p className="text-foreground-secondary mb-4 text-sm">
        What changed in each release, in plain language.{' '}
        <Link
          to="/news"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          See platform announcements
        </Link>
        .
      </p>

      {RELEASE_NOTES.map((note, index) => (
        <ReleaseEntry
          key={note.version}
          note={note}
          isFirst={index === 0}
          isLast={index === RELEASE_NOTES.length - 1}
        />
      ))}
    </div>
  );
}

export function WhatsNewView() {
  return (
    <ViewShell title="What's New">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <WhatsNewPanel />
      </div>
    </ViewShell>
  );
}
