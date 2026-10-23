import { Link } from '@tanstack/react-router';
import { SparklesIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, cn, Dialog, ViewShell } from '@tahti-player/ui';

import { PageBackLink } from '../components/PageBackLink';
import {
  countHighlights,
  RELEASE_NOTES,
  type ReleaseNote,
  type ReleaseNoteSection,
} from '../content/releaseNotes';

/** How many highlight bullets to show on the timeline before “Read full update”. */
const PREVIEW_HIGHLIGHT_LIMIT = 4;

function TimelineNode({ isLatest }: { isLatest?: boolean }) {
  return isLatest ? (
    <div className="bg-accent-yellow border-foreground flex size-7 shrink-0 items-center justify-center rounded-full border-(length:--border-width)">
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

function SectionList({
  sections,
  limit,
}: {
  sections: ReleaseNoteSection[];
  limit?: number;
}) {
  let remaining = limit ?? Number.POSITIVE_INFINITY;
  const shown: { label: string; highlights: string[] }[] = [];

  for (const section of sections) {
    if (remaining <= 0) {
      break;
    }
    const slice = section.highlights.slice(0, remaining);
    if (slice.length === 0) {
      continue;
    }
    shown.push({ label: section.label, highlights: slice });
    remaining -= slice.length;
  }

  return (
    <div className="flex flex-col gap-3">
      {shown.map((section) => (
        <div key={section.label}>
          <div className="text-foreground-secondary mb-1 text-xs font-semibold tracking-wide uppercase">
            {section.label}
          </div>
          <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm">
            {section.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ReleaseEntry({
  note,
  isFirst,
  isLast,
  onOpenFull,
}: {
  note: ReleaseNote;
  isFirst: boolean;
  isLast: boolean;
  onOpenFull: (note: ReleaseNote) => void;
}) {
  const total = countHighlights(note);
  const truncated = total > PREVIEW_HIGHLIGHT_LIMIT;
  const hiddenCount = truncated ? total - PREVIEW_HIGHLIGHT_LIMIT : 0;

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
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <span className="text-foreground-secondary text-xs font-medium">
            {note.period}
            {note.version ? ` · v${note.version}` : ''}
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
          {truncated ? (
            <Button
              variant="plain"
              size="flexible"
              className="hover:bg-background-secondary/80 block w-full rounded-none p-3 text-left whitespace-normal active:scale-100 sm:p-4"
              onClick={() => onOpenFull(note)}
              aria-label={`Read full update for ${note.period}`}
            >
              <SectionList
                sections={note.sections}
                limit={PREVIEW_HIGHLIGHT_LIMIT}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-primary-strong text-sm font-medium">
                  Read full update
                </span>
                <span className="text-foreground-secondary text-xs">
                  +{hiddenCount} more
                </span>
              </div>
            </Button>
          ) : (
            <div className="p-3 sm:p-4">
              <SectionList sections={note.sections} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Release notes timeline — embeddable under Settings. */
export function WhatsNewPanel() {
  const [fullNote, setFullNote] = useState<ReleaseNote | null>(null);

  return (
    <div className="flex w-full flex-col">
      <p className="text-foreground-secondary mb-4 text-sm">
        What changed in each two-week cycle, grouped by area.{' '}
        <Link
          to="/news"
          className="text-primary-strong font-medium underline-offset-2 hover:underline"
        >
          See platform announcements
        </Link>
        .
      </p>

      {RELEASE_NOTES.map((note, index) => (
        <ReleaseEntry
          key={note.id}
          note={note}
          isFirst={index === 0}
          isLast={index === RELEASE_NOTES.length - 1}
          onOpenFull={setFullNote}
        />
      ))}

      <Dialog.Root
        isOpen={fullNote !== null}
        onClose={() => setFullNote(null)}
        className="max-w-lg"
      >
        {fullNote ? (
          <>
            <Dialog.Title>{fullNote.period}</Dialog.Title>
            <Dialog.Description>
              {fullNote.version
                ? `Around web v${fullNote.version}`
                : 'Full update for this cycle'}
            </Dialog.Description>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
              <SectionList sections={fullNote.sections} />
            </div>
            <Dialog.Actions>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Actions>
          </>
        ) : null}
      </Dialog.Root>
    </div>
  );
}

export function WhatsNewView() {
  return (
    <ViewShell title="What's New">
      <PageBackLink to="/help" label="Help center" />
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <WhatsNewPanel />
      </div>
    </ViewShell>
  );
}
