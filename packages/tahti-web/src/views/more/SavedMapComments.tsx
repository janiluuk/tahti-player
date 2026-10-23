import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Textarea, Tooltip } from '@tahti-player/ui';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MAP_CASE_GROUPS } from '../../content/mapScreens';
import { downloadMapCommentsCsv } from '../../lib/mapCommentsCsv';
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
        c.kind === 'case' || c.kind === 'flow' || c.kind === 'page'
          ? lookup[c.targetId]
          : undefined;
      const lines = [
        `# ${c.title}`,
        `Status: ${c.resolvedAt ? 'resolved' : 'open'}`,
      ];
      if (ref) {
        lines.push(`Route: ${ref.route}`);
        if (ref.image) {
          lines.push(`Screenshot: https://beta.tahti.live${ref.image}`);
        }
      } else if (c.kind === 'feature' && c.feature) {
        lines.push(`Feature: ${c.feature}`);
      } else if (c.kind === 'page') {
        lines.push(`Route: ${c.targetId}`);
      }
      if (c.pack) {
        lines.push(`Pack: ${c.pack}`);
      }
      lines.push(`Comment: ${c.text}`);
      lines.push(`Submitted: ${new Date(c.submittedAt).toLocaleString()}`);
      if (c.updatedAt) {
        lines.push(`Updated: ${new Date(c.updatedAt).toLocaleString()}`);
      }
      if (c.resolvedAt) {
        lines.push(`Resolved: ${new Date(c.resolvedAt).toLocaleString()}`);
      }
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
    <Tooltip
      content="Copy all comments as plain text, each with its page route and screenshot link, ready to paste back into a chat"
      side="bottom"
      wrapperClassName="inline-flex"
      multiline
    >
      <Button size="sm" onClick={copy} disabled={comments.length === 0}>
        {state === 'copied'
          ? 'Copied ✓'
          : state === 'error'
            ? 'Copy failed — select & copy manually'
            : `Copy all (${comments.length})`}
      </Button>
    </Tooltip>
  );
}

function CommentRow({ comment }: { comment: MapComment }) {
  const updateComment = useMapNotesStore((s) => s.updateComment);
  const resolveComment = useMapNotesStore((s) => s.resolveComment);
  const unresolveComment = useMapNotesStore((s) => s.unresolveComment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const resolved = Boolean(comment.resolvedAt);

  return (
    <li
      className={`border-border rounded-lg border px-3 py-2 text-sm ${
        resolved
          ? 'bg-background-secondary/20 opacity-80'
          : 'bg-background-secondary/40'
      }`}
    >
      <div className="text-foreground-secondary flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-wide uppercase">
        <span>{comment.kind}</span>
        <span>{comment.title}</span>
        {comment.pack ? <span>pack {comment.pack}</span> : null}
        <span>{new Date(comment.submittedAt).toLocaleString()}</span>
        <Badge variant="pill" color={resolved ? 'green' : 'orange'}>
          {resolved ? 'Resolved' : 'Open'}
        </Badge>
      </div>
      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <Textarea
            tone="secondary"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={`Edit comment on ${comment.title}`}
            className="min-h-[4.5rem] text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!draft.trim()}
              onClick={() => {
                if (updateComment(comment.id, draft)) {
                  setEditing(false);
                  toast.success('Comment updated');
                }
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDraft(comment.text);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap">{comment.text}</p>
      )}
      {!editing ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="text"
            onClick={() => {
              setDraft(comment.text);
              setEditing(true);
            }}
          >
            Edit
          </Button>
          {resolved ? (
            <Button
              size="sm"
              variant="text"
              onClick={() => unresolveComment(comment.id)}
            >
              Reopen
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                resolveComment(comment.id);
                toast.success('Comment resolved');
              }}
            >
              Resolve
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function SavedMapComments() {
  const comments = useMapNotesStore((s) => s.comments);
  const clearComments = useMapNotesStore((s) => s.clearComments);
  const [confirmClear, setConfirmClear] = useState(false);
  const openCount = comments.filter((c) => !c.resolvedAt).length;

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
            From the atlas and the admin page-comment panel · stored in
            localStorage (
            <code className="text-foreground">tahti-web-map-notes</code>).
            Export CSV to hand open items to whoever is fixing them.
          </p>
          <p className="text-foreground-secondary mt-1 text-xs tracking-wide uppercase">
            {comments.length} total · {openCount} open
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip
            content="Download CSV with status, route, and commentary for fixing"
            side="bottom"
            wrapperClassName="inline-flex"
            multiline
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadMapCommentsCsv(comments)}
            >
              Export CSV ({comments.length})
            </Button>
          </Tooltip>
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
      <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {comments.map((c) => (
          <CommentRow key={c.id} comment={c} />
        ))}
      </ul>
      <ConfirmDialog
        isOpen={confirmClear}
        title={`Clear all ${comments.length} saved comments?`}
        description="They are only stored in this browser, so they can't be recovered. Export CSV or copy them first if you still need them."
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
