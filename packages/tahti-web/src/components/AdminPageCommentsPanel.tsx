import { useRouterState } from '@tanstack/react-router';
import { CheckIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Textarea, Tooltip } from '@tahti-player/ui';

import { downloadMapCommentsCsv } from '../lib/mapCommentsCsv';
import { mapPageTargetForPath } from '../lib/mapPageTarget';
import { useLayoutStore } from '../stores/layoutStore';
import { useMapNotesStore, type MapComment } from '../stores/mapNotesStore';
import { usePageCommentsRailStore } from '../stores/pageCommentsRailStore';
import { MapCommentForm } from './MapCommentForm';
import { PageEmpty } from './PageStates';

function PageCommentRow({ comment }: { comment: MapComment }) {
  const updateComment = useMapNotesStore((s) => s.updateComment);
  const resolveComment = useMapNotesStore((s) => s.resolveComment);
  const unresolveComment = useMapNotesStore((s) => s.unresolveComment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const resolved = Boolean(comment.resolvedAt);

  return (
    <li
      className={`border-border rounded-md border px-2 py-2 text-sm ${
        resolved ? 'opacity-70' : ''
      }`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <Badge variant="pill" color={resolved ? 'green' : 'orange'}>
          {resolved ? 'Resolved' : 'Open'}
        </Badge>
        <span className="text-foreground-secondary text-[10px] tracking-wide uppercase">
          {new Date(comment.submittedAt).toLocaleString()}
        </span>
      </div>
      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (updateComment(comment.id, draft)) {
              setEditing(false);
              toast.success('Comment updated');
            }
          }}
        >
          <Textarea
            tone="secondary"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Edit page comment"
            className="min-h-[4rem] text-sm"
            submitOnModEnter
          />
          <div className="flex flex-wrap gap-1">
            <Button size="sm" type="submit" disabled={!draft.trim()}>
              Save
            </Button>
            <Button
              size="sm"
              variant="text"
              onClick={() => {
                setDraft(comment.text);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className="whitespace-pre-wrap">{comment.text}</p>
      )}
      {!editing ? (
        <div className="mt-2 flex flex-wrap gap-1">
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
              <CheckIcon size={12} aria-hidden className="mr-1" />
              Resolve
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}

/** Board-only right-rail panel: same map-notes store as the Tahti atlas. */
export function AdminPageCommentsPanel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const target = useMemo(() => mapPageTargetForPath(pathname), [pathname]);
  const comments = useMapNotesStore((s) => s.comments);
  const closePanel = usePageCommentsRailStore((s) => s.close);
  const setRightCollapsed = useLayoutStore((s) => s.setRightCollapsed);

  const forPage = comments.filter(
    (c) =>
      (c.kind === target.kind && c.targetId === target.targetId) ||
      (target.mapCase &&
        (c.kind === 'case' || c.kind === 'flow') &&
        c.targetId === target.mapCase.id),
  );
  const openCount = forPage.filter((c) => !c.resolvedAt).length;

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3"
      data-testid="admin-page-comments"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold">
            {target.title}
          </p>
          <p className="text-foreground-secondary font-mono text-[11px] break-all">
            {pathname}
          </p>
          <p className="text-foreground-secondary mt-1 text-[11px]">
            Same store as Tahti atlas · {forPage.length} here · {openCount} open
          </p>
        </div>
        <Tooltip content="Close page comments" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label="Close page comments"
            onClick={() => {
              closePanel();
              setRightCollapsed(false);
            }}
          >
            <XIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>

      <MapCommentForm
        kind={target.kind}
        targetId={target.targetId}
        title={target.title}
        label="New comment"
        placeholder="What needs fixing on this page…"
        className="flex flex-col gap-2"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={comments.length === 0}
          onClick={() => downloadMapCommentsCsv(comments)}
        >
          Export all CSV
        </Button>
      </div>

      {forPage.length === 0 ? (
        <PageEmpty
          title="No comments for this page yet"
          description="Saved notes also appear under Saved comments on the Tahti atlas."
        />
      ) : (
        <ul className="tahti-hide-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {forPage.map((c) => (
            <PageCommentRow key={c.id} comment={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
