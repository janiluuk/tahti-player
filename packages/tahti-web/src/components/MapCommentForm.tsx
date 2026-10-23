import { useEffect, useState, type FormEvent } from 'react';

import { Button, Textarea } from '@tahti-player/ui';

import {
  mapDraftKey,
  useMapNotesStore,
  type MapCommentKind,
} from '../stores/mapNotesStore';

type Props = {
  kind: MapCommentKind;
  targetId: string;
  title: string;
  pack?: string;
  feature?: string;
  placeholder?: string;
  /** Extra class on the outer wrapper (e.g. border-t padding). */
  className?: string;
  label?: string;
};

export function MapCommentForm({
  kind,
  targetId,
  title,
  pack,
  feature,
  placeholder,
  className,
  label = 'Your notes',
}: Props) {
  const key = mapDraftKey(kind, targetId);
  const draft = useMapNotesStore(
    (s) =>
      s.draftsByKey[key] ??
      (kind === 'case' ? (s.notesByCaseId[targetId] ?? '') : ''),
  );
  const setDraft = useMapNotesStore((s) => s.setDraft);
  const submitComment = useMapNotesStore((s) => s.submitComment);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!savedFlash) {
      return;
    }
    const t = window.setTimeout(() => setSavedFlash(false), 2000);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  const fieldId = `map-comment-${kind}-${targetId}`;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const saved = submitComment({
      kind,
      targetId,
      title,
      pack,
      feature,
      text: draft,
    });
    if (saved) {
      // Clear so another comment can be added for the same target.
      setDraft(kind, targetId, '');
      setSavedFlash(true);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        className ?? 'border-border flex flex-col gap-2 border-t px-4 py-4'
      }
    >
      <Textarea
        id={fieldId}
        label={label}
        tone="secondary"
        rows={3}
        value={draft}
        onChange={(e) => setDraft(kind, targetId, e.target.value)}
        placeholder={placeholder ?? `Notes for “${title}”…`}
        className="min-h-[5.5rem] text-sm"
        aria-label={`${label} for ${title}`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={!draft.trim()}>
          Save comment
        </Button>
        <p className="text-foreground-secondary text-[11px]">
          {savedFlash
            ? 'Saved on this device.'
            : 'Persists in this browser (localStorage).'}
        </p>
      </div>
    </form>
  );
}
