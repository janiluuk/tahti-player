import { Link } from '@tanstack/react-router';
import { UploadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input, SaveButton, ViewShell } from '@tahti-player/ui';

import { fetchSoundVersions } from '../../api/sound-versions';
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
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { usePolling } from '../../hooks/usePolling';
import { useMasteringFeatureStore } from '../../plugins/mastering/store';
import { MasteringPanel } from './pro-editor/MasteringPanel';
import { StemsPanel } from './pro-editor/StemsPanel';
import { WaveformEditor } from './pro-editor/WaveformEditor';

const DEFAULT_VERSION_LABEL = 'Edited mix';

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
  const [editList, setEditList] = useState<EditList | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [serverPeaks, setServerPeaks] = useState<number[]>([]);
  const [versionLabel, setVersionLabel] = useState(DEFAULT_VERSION_LABEL);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A render's versionId while it is PENDING/PROCESSING, polled for
  // completion — the old Next app streamed live SSE progress; the SPA has no
  // equivalent, so without this a render is fire-and-forget.
  const [renderPendingVersionId, setRenderPendingVersionId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [renderPromptOpen, setRenderPromptOpen] = useState(false);

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
        const list = fromDraft ?? createDefaultEditList(durationHint);
        setEditList(
          src.data.durationSec && list.sourceDuration < 1
            ? { ...list, sourceDuration: src.data.durationSec }
            : list,
        );
        setUpdatedAt(draft.data.updatedAt);
        const level = draft.data.editorPeaks?.levels?.[0];
        setServerPeaks(level && level.length > 0 ? level : []);
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
    try {
      const result = await saveEditorDraft(soundId, editList, updatedAt);
      if (!result.ok) {
        setMessage(result.error);
        toast.error(result.error);
        return;
      }
      setUpdatedAt(result.updatedAt);
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
    try {
      const saveFirst = await saveEditorDraft(soundId, editList, updatedAt);
      if (saveFirst.ok) {
        setUpdatedAt(saveFirst.updatedAt);
      } else {
        // The render still uses the edits on screen; just say the draft
        // itself was not stored.
        toast.warning(`Draft not saved: ${saveFirst.error}`);
      }
      const result = await renderEditorDraft(
        soundId,
        editList,
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
      <div className="studio-page-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/editor" />
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
          <ClientCapabilityNotice kind="partial" title="Single-track editor">
            Cut, trim, adjust effects, or request stems here. Use a multitrack
            session when you need to arrange several tracks together.
          </ClientCapabilityNotice>

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
              <WaveformEditor
                sourceUrl={sourceUrl}
                serverPeaks={serverPeaks}
                editList={editList}
                onChange={setEditList}
                onDuration={adoptDecodedDuration}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <StemsPanel soundId={soundId} />

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
                        <UploadIcon size={16} aria-hidden className="mr-1.5" />
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

              <MasteringPanel editList={editList} onChange={setEditList} />
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
      </div>
    </StudioGate>
  );
}
