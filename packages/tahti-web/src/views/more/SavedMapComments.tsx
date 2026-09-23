import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MAP_CASE_GROUPS } from '../../content/mapScreens';
import { useMapNotesStore, type MapComment } from '../../stores/mapNotesStore';

/** case id -> route/screenshot, so a copied comment can point back at the
 * exact page/image it was left on without the reader needing to reopen
 * the atlas. */
function caseRefLookup(): Record<
  string,
  { viewName: string; route: string; image?: string }
> {
  const map: Record<
    string,
    { viewName: string; route: string; image?: string }
  > = {};
  for (const group of MAP_CASE_GROUPS) {
    for (const c of group.cases) {
      map[c.id] = {
        viewName: c.viewName,
        route: c.new.route,
        image: c.new.image,
      };
    }
  }
  return map;
}

function commentsToPlainText(comments: MapComment[]): string {
  const lookup = caseRefLookup();
  return comments
    .map((c) => {
      const ref =
        c.kind === 'case' || c.kind === 'flow' ? lookup[c.targetId] : undefined;
      const lines = [`# ${c.title}`];
      if (ref) {
        lines.push(`Route: ${ref.route}`);
        if (ref.image) {
          lines.push(`Screenshot: https://beta.tahti.live${ref.image}`);
        }
      } else if (c.kind === 'feature' && c.feature) {
        lines.push(`Feature: ${c.feature}`);
      }
      if (c.pack) {
        lines.push(`Pack: ${c.pack}`);
      }
      lines.push(`Comment: ${c.text}`);
      lines.push(`Submitted: ${new Date(c.submittedAt).toLocaleString()}`);
      return lines.join('\n');
    })
    .join('\n\n---\n\n');
}

function CopyCommentsButton({ comments }: { comments: MapComment[] }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  const copy = async () => {
    const text = commentsToPlainText(comments);
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('error');
    }
    window.setTimeout(() => setState('idle'), 2500);
  };

  return (
    <Button
      size="sm"
      onClick={copy}
      disabled={comments.length === 0}
      title="Copy all comments as plain text, each with its page route and screenshot link, ready to paste back into a chat"
    >
      {state === 'copied'
        ? 'Copied ✓'
        : state === 'error'
          ? 'Copy failed — select & copy manually'
          : `Copy all (${comments.length})`}
    </Button>
  );
}

export function SavedMapComments() {
  const comments = useMapNotesStore((s) => s.comments);
  const clearComments = useMapNotesStore((s) => s.clearComments);
  const [confirmClear, setConfirmClear] = useState(false);

  if (comments.length === 0) {
    return null;
  }

  return (
    <section
      id="saved-comments"
      className="border-border flex flex-col gap-3 rounded-xl border p-4"
      aria-labelledby="saved-comments-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="saved-comments-heading"
            className="font-display text-xl font-bold tracking-tight"
          >
            Saved comments
          </h2>
          <p className="text-foreground-secondary mt-1 text-sm">
            Submitted from this page · stored in localStorage (
            <code className="text-foreground">tahti-web-map-notes</code>). Copy
            them all and paste into a chat to hand them off for fixing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyCommentsButton comments={comments} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setConfirmClear(true)}
          >
            Clear log
          </Button>
        </div>
      </div>
      <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {comments.map((c) => (
          <li
            key={c.id}
            className="border-border bg-background-secondary/40 rounded-lg border px-3 py-2 text-sm"
          >
            <div className="text-foreground-secondary flex flex-wrap gap-x-2 text-[11px] tracking-wide uppercase">
              <span>{c.kind}</span>
              <span>{c.title}</span>
              {c.pack ? <span>pack {c.pack}</span> : null}
              <span>{new Date(c.submittedAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap">{c.text}</p>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        isOpen={confirmClear}
        title={`Clear all ${comments.length} saved comments?`}
        description="They are only stored in this browser, so they can't be recovered. Copy them first if you still need them."
        confirmLabel="Clear log"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearComments();
          setConfirmClear(false);
          toast.success('Saved comments cleared');
        }}
      />
    </section>
  );
}
