import { Link, useBlocker } from '@tanstack/react-router';
import { UploadIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';

import { preferInternalEngine } from '@tahti-player/audio-core';
import { MultitrackEditor } from '@tahti-player/audio-editor';
import { Button, Dialog, Input, SaveButton, ViewShell } from '@tahti-player/ui';
import { VisualizerHost } from '@tahti-player/visualizer';

import {
  fetchSoundVersions,
  uploadSoundVersion,
} from '../../api/sound-versions';
import {
  fetchEditorDraft,
  fetchEditorSource,
  renderEditorDraft,
  saveEditorDraft,
} from '../../api/studio';
import type { EditList } from '../../api/studio-types';
import { createDefaultEditList } from '../../api/studio-types';
import { ClientCapabilityNotice } from '../../components/ClientCapabilityNotice';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { usePolling } from '../../hooks/usePolling';
import { useAudioFxStore } from '../../plugins/audio-fx';
import { chainForRender, withLegacyChain } from '../../plugins/audio-fx/chain';
import { useMasteringFeatureStore } from '../../plugins/mastering/store';
import {
  COALESCE_MS,
  emptyHistory,
  recordEdit,
  redoEdit,
  undoEdit,
  type EditHistory,
} from './pro-editor/editHistory';
import { MasteringPanel } from './pro-editor/MasteringPanel';
import { StemsPanel } from './pro-editor/StemsPanel';
import type { EditorPeaks } from './pro-editor/waveform/useWaveformData';
import { WaveformEditor } from './pro-editor/WaveformEditor';
import { useMultitrackSession } from './useMultitrackSession';

const DEFAULT_VERSION_LABEL = 'Edited mix';
const MULTITRACK_BOUNCE_LABEL = 'Multitrack bounce';

/** Keyed by sound so navigating between tracks starts from a clean editor
 * (selection, markers, zoom, unsaved edits, audio) instead of carrying the
 * previous track's state over. */
export function StudioProEditorView({ soundId }: { soundId: string }) {
  return <ProEditor key={soundId} soundId={soundId} />;
}

function ProEditor({ soundId }: { soundId: string }) {
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [editorMode, setEditorMode] = useState<'trim' | 'multitrack'>('trim');
  const modeTrimId = useId();
  const modeMultiId = useId();
  const [editList, setEditList] = useState<EditList | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [serverPeaks, setServerPeaks] = useState<EditorPeaks | null>(null);
  const [history, setHistory] = useState<EditHistory<EditList>>(emptyHistory);
  const lastEditRef = useRef<{ key: string; at: number } | null>(null);
  const [versionLabel, setVersionLabel] = useState(DEFAULT_VERSION_LABEL);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const {
    multitrackReady,
    editorProjectId,
    sessionSync,
    persistSession,
    ensureMultitrackSession,
    sendStemsToMultitrack,
  } = useMultitrackSession({
    soundId,
    title,
    editorMode,
    setEditorMode,
    setBusy,
  });
  // A render's versionId while it is PENDING/PROCESSING, polled for
  // completion — the old Next app streamed live SSE progress; the SPA has no
  // equivalent, so without this a render is fire-and-forget.
  const [renderPendingVersionId, setRenderPendingVersionId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [renderPromptOpen, setRenderPromptOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Bumped on every edit so a save only clears `dirty` if nothing changed
  // while it was in flight.
  const editRevisionRef = useRef(0);

  const markEdited = () => {
    editRevisionRef.current += 1;
    setDirty(true);
  };

  const edit = (next: EditList, coalesceKey?: string) => {
    if (!editList) {
      return;
    }
    const now = Date.now();
    const last = lastEditRef.current;
    const coalesce = Boolean(
      coalesceKey && last?.key === coalesceKey && now - last.at < COALESCE_MS,
    );
    lastEditRef.current = coalesceKey ? { key: coalesceKey, at: now } : null;
    setHistory((current) => recordEdit(current, editList, coalesce));
    setEditList(next);
    markEdited();
  };

  const undo = () => {
    const step = editList && undoEdit(history, editList);
    if (step) {
      lastEditRef.current = null;
      setHistory(step.history);
      setEditList(step.value);
      markEdited();
    }
  };

  const redo = () => {
    const step = editList && redoEdit(history, editList);
    if (step) {
      lastEditRef.current = null;
      setHistory(step.history);
      setEditList(step.value);
      markEdited();
    }
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      !(event.ctrlKey || event.metaKey) ||
      target.closest('input, textarea, select, [contenteditable="true"]')
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      redo();
    }
  };

  const leaveGuard = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: dirty,
    withResolver: true,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchEditorSource(soundId), fetchEditorDraft(soundId)])
      .then(([src, draft]) => {
        if (cancelled) {
          return;
        }
        setSourceUrl(src.data.url);
        setTitle(src.data.title);
        const fromDraft = draft.data.editList;
        const durationHint =
          src.data.durationSec ?? fromDraft?.sourceDuration ?? 180;
        const list = withLegacyChain(
          fromDraft ?? createDefaultEditList(durationHint),
        );
        setEditList(
          src.data.durationSec && list.sourceDuration < 1
            ? { ...list, sourceDuration: src.data.durationSec }
            : list,
        );
        setUpdatedAt(draft.data.updatedAt);
        setServerPeaks(draft.data.editorPeaks ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  usePolling(
    () => {
      fetchSoundVersions(soundId)
        .then((r) => {
          const version = r.data.find((v) => v.id === renderPendingVersionId);
          if (
            !version ||
            version.status === 'PENDING' ||
            version.status === 'PROCESSING'
          ) {
            return;
          }
          setRenderPendingVersionId(null);
          const text =
            version.status === 'READY'
              ? `Version ${version.versionNumber} is ready${version.isActive ? ' and live' : " — activate it from Revision history when you're ready"}.`
              : `Version ${version.versionNumber} failed to render.`;
          setMessage(text);
          if (version.status === 'READY') {
            toast.success(text);
          } else {
            toast.error(text);
          }
        })
        .catch(() => undefined);
    },
    4000,
    Boolean(renderPendingVersionId),
  );

  const adoptDecodedDuration = (seconds: number) =>
    setEditList((prev) =>
      prev && prev.sourceDuration < 1
        ? { ...prev, sourceDuration: seconds }
        : prev,
    );

  const save = async () => {
    if (!editList) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const revisionAtSave = editRevisionRef.current;
    try {
      const result = await saveEditorDraft(soundId, editList, updatedAt);
      if (!result.ok) {
        setMessage(result.error);
        toast.error(result.error);
        return;
      }
      setUpdatedAt(result.updatedAt);
      if (editRevisionRef.current === revisionAtSave) {
        setDirty(false);
      }
      setMessage('Draft saved.');
      toast.success('Draft saved.');
    } catch {
      toast.error('Could not save the draft. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const render = async (activate: boolean) => {
    if (!editList) {
      return;
    }
    setRenderPromptOpen(false);
    setBusy(true);
    setMessage(null);
    const revisionAtSave = editRevisionRef.current;
    try {
      const saveFirst = await saveEditorDraft(soundId, editList, updatedAt);
      if (saveFirst.ok) {
        setUpdatedAt(saveFirst.updatedAt);
        if (editRevisionRef.current === revisionAtSave) {
          setDirty(false);
        }
      } else {
        // The render still uses the edits on screen; just say the draft
        // itself was not stored.
        toast.warning(`Draft not saved: ${saveFirst.error}`);
      }
      const result = await renderEditorDraft(
        soundId,
        chainForRender(editList, useAudioFxStore.getState().enabledPluginIds),
        versionLabel.trim() || DEFAULT_VERSION_LABEL,
        activate,
      );
      if (!result.ok) {
        setMessage(result.error);
        toast.error(result.error);
        return;
      }
      let text: string;
      if (result.status === 'PENDING' || result.status === 'PROCESSING') {
        setRenderPendingVersionId(result.versionId);
        text = activate
          ? `Rendering — this version will go live once it's ready…`
          : `Rendering as a new revision — the current live version is untouched…`;
      } else {
        text = activate
          ? `Render started — version ${result.versionId} will go live, ${result.status.toLowerCase()}.`
          : `Saved as a new revision — version ${result.versionId}, ${result.status.toLowerCase()}. The current live version is untouched; activate it from Revision history when you're ready.`;
      }
      setMessage(text);
      toast.success(text);
    } catch {
      toast.error('Could not start the render. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioGate requireChannel={false}>
      <div
        className="studio-page-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 py-2"
        onKeyDown={onEditorKeyDown}
      >
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            to="/studio/sounds"
            className="text-foreground-secondary hover:underline"
          >
            ← Music
          </Link>
          <Link
            to="/studio/sounds/$id"
            params={{ id: soundId }}
            className="text-foreground-secondary hover:underline"
          >
            Metadata
          </Link>
          <Link
            to="/studio/editor"
            className="text-foreground-secondary hover:underline"
          >
            Projects
          </Link>
          {masteringEnabled && (
            <Link
              to="/studio/mastering/$id"
              params={{ id: soundId }}
              className="text-foreground-secondary hover:underline"
            >
              Mastering
            </Link>
          )}
        </div>

        <ViewShell
          title={title || 'Pro editor'}
          classes={{ root: 'px-0 pt-0' }}
        >
          <ClientCapabilityNotice kind="partial" title="Studio editor">
            Trim mode keeps the draft/render pipeline. Multitrack mode ports
            theDAW&apos;s browser rack + live mixer; bounce downloads a WAV you
            can attach as a version after render.
          </ClientCapabilityNotice>

          <div
            className="flex flex-wrap gap-3 text-sm"
            role="radiogroup"
            aria-label="Editor mode"
          >
            <div className="flex items-center gap-2">
              <input
                id={modeTrimId}
                name="studio-editor-mode"
                type="radio"
                checked={editorMode === 'trim'}
                onChange={() => setEditorMode('trim')}
              />
              <label htmlFor={modeTrimId}>Trim / effects</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={modeMultiId}
                name="studio-editor-mode"
                type="radio"
                checked={editorMode === 'multitrack'}
                onChange={() => {
                  setEditorMode('multitrack');
                  if (!multitrackReady) {
                    void ensureMultitrackSession();
                  } else {
                    preferInternalEngine();
                  }
                }}
              />
              <label htmlFor={modeMultiId}>Multitrack + viz</label>
            </div>
          </div>

          {loading ? (
            <StudioPanel>
              <PageLoading label="Loading editor…" />
            </StudioPanel>
          ) : loadFailed || !editList ? (
            <PageEmpty
              title="Could not load the editor"
              description="Check your connection and reload the page."
            />
          ) : (
            <>
              {editorMode === 'trim' ? (
                <WaveformEditor
                  sourceUrl={sourceUrl}
                  serverPeaks={serverPeaks}
                  editList={editList}
                  onChange={edit}
                  onDuration={adoptDecodedDuration}
                  canUndo={history.past.length > 0}
                  canRedo={history.future.length > 0}
                  onUndo={undo}
                  onRedo={redo}
                />
              ) : (
                <MultitrackEditor
                  showVizSlot
                  vizSlot={
                    <VisualizerHost className="h-full min-h-48 w-full" />
                  }
                  onBounce={async (blob) => {
                    setBusy(true);
                    try {
                      const file = new File(
                        [blob],
                        `${title || 'mixdown'}-bounce.wav`,
                        { type: blob.type || 'audio/wav' },
                      );
                      const uploaded = await uploadSoundVersion(
                        soundId,
                        file,
                        versionLabel.trim() || MULTITRACK_BOUNCE_LABEL,
                      );
                      if (uploaded.ok) {
                        toast.success(
                          `Bounce uploaded as revision ${uploaded.versionNumber}.`,
                        );
                        setMessage(
                          `Bounce uploaded as revision ${uploaded.versionNumber} (${uploaded.status}).`,
                        );
                      } else {
                        toast.error(uploaded.error);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = file.name;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.info('WAV downloaded as a fallback.');
                      }
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}

              {editorMode === 'trim' ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <StemsPanel
                      soundId={soundId}
                      onSendToMultitrack={(job) =>
                        void sendStemsToMultitrack(job)
                      }
                    />

                    <StudioPanel title="Export">
                      <div className="flex flex-col gap-3">
                        <Input
                          label="Version label"
                          value={versionLabel}
                          onChange={(e) => setVersionLabel(e.target.value)}
                        />
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => setRenderPromptOpen(true)}
                          >
                            <UploadIcon
                              size={16}
                              aria-hidden
                              className="mr-1.5"
                            />
                            Render version
                          </Button>
                          <SaveButton
                            saving={busy}
                            label="Save draft"
                            onClick={() => void save()}
                          />
                        </div>
                        {message && (
                          <p
                            className="text-foreground-secondary text-sm"
                            role="status"
                          >
                            {message}
                          </p>
                        )}
                      </div>
                    </StudioPanel>
                  </div>

                  <MasteringPanel
                    editList={editList}
                    onChange={(next) => edit(next, 'mastering')}
                  />
                </>
              ) : (
                <>
                  <StemsPanel
                    soundId={soundId}
                    onSendToMultitrack={(job) =>
                      void sendStemsToMultitrack(job)
                    }
                  />
                  <StudioPanel title="Multitrack session">
                    <div className="flex flex-col gap-3">
                      <p
                        className="text-foreground-secondary text-sm"
                        role="status"
                      >
                        {sessionSync === 'synced'
                          ? 'Session synced to editor projects (arrange metadata). FX and audio stay in this browser (OPFS).'
                          : sessionSync === 'syncing'
                            ? 'Syncing session…'
                            : sessionSync === 'local'
                              ? 'Local only — server sync unavailable. OPFS autosave still applies.'
                              : 'Open Multitrack to link an editor project for this sound.'}
                      </p>
                      <Input
                        label="Version label"
                        value={versionLabel}
                        onChange={(e) => setVersionLabel(e.target.value)}
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy || !editorProjectId}
                          onClick={() => void persistSession()}
                        >
                          Save session
                        </Button>
                      </div>
                      <p className="text-foreground-secondary text-sm">
                        <strong>Bounce</strong> uploads a WAV revision via sound
                        versions. Full mix FX remain local until bounce.
                      </p>
                      {message && (
                        <p
                          className="text-foreground-secondary text-sm"
                          role="status"
                        >
                          {message}
                        </p>
                      )}
                    </div>
                  </StudioPanel>
                </>
              )}
            </>
          )}
        </ViewShell>

        <Dialog.Root
          isOpen={renderPromptOpen}
          onClose={() => setRenderPromptOpen(false)}
        >
          <Dialog.Title>
            Render “{versionLabel.trim() || DEFAULT_VERSION_LABEL}”
          </Dialog.Title>
          <Dialog.Description>
            Overwrite replaces what&apos;s live right now. Save as a new
            revision renders and adds it to Revision history without touching
            the current live version — activate it there whenever you&apos;re
            ready.
          </Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button variant="secondary" onClick={() => void render(false)}>
              Save as new revision
            </Button>
            <Button onClick={() => void render(true)}>
              Overwrite live version
            </Button>
          </Dialog.Actions>
        </Dialog.Root>

        <Dialog.Root
          isOpen={leaveGuard.status === 'blocked'}
          onClose={() => leaveGuard.reset?.()}
        >
          <Dialog.Title>Leave without saving?</Dialog.Title>
          <Dialog.Description>
            Your edits to this track haven&apos;t been saved as a draft. They
            will be lost if you leave now.
          </Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close>Stay</Dialog.Close>
            <Button intent="danger" onClick={() => leaveGuard.proceed?.()}>
              Leave without saving
            </Button>
          </Dialog.Actions>
        </Dialog.Root>
      </div>
    </StudioGate>
  );
}
