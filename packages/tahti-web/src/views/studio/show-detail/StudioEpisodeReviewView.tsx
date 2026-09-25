import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, CheckIcon, RadioIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  ButtonLink,
  Input,
  SaveButton,
  Textarea,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  approveEpisode,
  fetchEpisode,
  fetchShowSeriesById,
  patchEpisode,
  type StudioEpisode,
  type StudioShowSeries,
} from '../../../api/shows';
import { fetchEditorDraft, renderEditorDraft } from '../../../api/studio';
import { createDefaultEditList } from '../../../api/studio-types';
import { PageEmpty, PageLoading } from '../../../components/PageStates';
import { StudioGate } from '../../../components/StudioGate';
import { StudioPanel } from '../../../components/StudioPanel';
import { Eyebrow } from '../../../components/tahti/Eyebrow';
import { trimToCuts } from '../episodeTrim';
import { episodeStatusLabel } from '../StudioShowsView';

export function StudioEpisodeReviewView({ episodeId }: { episodeId: string }) {
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<StudioEpisode | null>(null);
  const [show, setShow] = useState<StudioShowSeries | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [normalize, setNormalize] = useState(true);
  const [publicTitle, setPublicTitle] = useState('');
  const [publicDescription, setPublicDescription] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetchEpisode(episodeId);
        if (cancelled) {
          return;
        }
        setEpisode(r.data);
        if (r.data) {
          setPublicTitle(r.data.title);
          setPublicDescription(r.data.description);
          const s = await fetchShowSeriesById(r.data.showId);
          if (!cancelled) {
            setShow(s.data);
          }
        } else {
          setLoadError(true);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [episodeId]);

  if (!episode) {
    return (
      <StudioGate>
        <div className="studio-page-layout flex w-full flex-col">
          {loadError ? (
            <PageEmpty title="Episode not found" />
          ) : (
            <PageLoading label="Loading…" />
          )}
        </div>
      </StudioGate>
    );
  }

  const needsApproval =
    episode.source === 'broadcast' || episode.status === 'PENDING_APPROVAL';

  const approve = async () => {
    setBusy(true);
    try {
      const r = await approveEpisode(episode.id);
      if (!r.ok) {
        setMsg(r.error);
        toast.error(r.error);
        return;
      }
      setEpisode(r.data);
      const text = 'Episode approved — ready to schedule or publish.';
      setMsg(text);
      toast.success(text);
    } catch {
      toast.error('Could not approve the episode.');
    } finally {
      setBusy(false);
    }
  };

  const applyTrim = async () => {
    const soundId = episode.soundId;
    if (!soundId) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { data: draft } = await fetchEditorDraft(soundId);
      const base = draft.editList ?? createDefaultEditList(180);
      const cuts = trimToCuts(trimStart, trimEnd, base.sourceDuration);
      const editList = {
        ...base,
        cuts: cuts.length ? cuts : base.cuts,
        loudnorm: { enabled: normalize, targetLufs: -14, targetTp: -1.5 },
      };
      const r = await renderEditorDraft(
        soundId,
        editList,
        `Episode ${episode.episodeNumber} review`,
      );
      const text = r.ok
        ? 'Render queued — check the archive editor for progress.'
        : r.error;
      setMsg(text);
      (r.ok ? toast.success : toast.error)(text);
    } catch {
      toast.error('Could not queue the render.');
    } finally {
      setBusy(false);
    }
  };

  const savePublicDetails = async () => {
    setSavingDetails(true);
    setMsg(null);
    const result = await patchEpisode(episode.id, {
      title: publicTitle.trim() || episode.title,
      description: publicDescription.trim(),
    });
    setSavingDetails(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setEpisode(result.data);
    setPublicTitle(result.data.title);
    setPublicDescription(result.data.description);
    setMsg('Public show details saved.');
  };

  return (
    <StudioGate>
      <div className="studio-page-layout flex w-full flex-col gap-6">
        <Tooltip content={`Back to ${show?.title ?? 'Show'}`} side="right">
          <Link
            to="/studio/shows/$id"
            params={{ id: episode.showId }}
            aria-label={`Back to ${show?.title ?? 'Show'}`}
            className="text-foreground-secondary hover:bg-background-secondary inline-flex size-8 w-fit items-center justify-center rounded-full"
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Link>
        </Tooltip>

        <ViewShell
          title={episode.title}
          classes={{ root: 'px-0 pt-0' }}
          actions={<Eyebrow>Episode #{episode.episodeNumber}</Eyebrow>}
        >
          {episode.description ? (
            <p className="text-sm">{episode.description}</p>
          ) : null}

          <StudioPanel
            title="Public show details"
            description="What listeners see when they open this show from the Tahti Radio schedule."
          >
            <div className="flex flex-col gap-3">
              <Input
                label="Episode title"
                value={publicTitle}
                onChange={(event) => setPublicTitle(event.target.value)}
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-foreground-secondary text-xs uppercase">
                  Description
                </span>
                <Textarea
                  tone="secondary"
                  value={publicDescription}
                  onChange={(event) => setPublicDescription(event.target.value)}
                  rows={4}
                />
              </label>
              <div className="flex justify-end">
                <SaveButton
                  saving={savingDetails}
                  label="Save public details"
                  onClick={() => void savePublicDetails()}
                />
              </div>
            </div>
          </StudioPanel>

          {needsApproval && (
            <StudioPanel
              title="Review before approve"
              description="Recorded episodes must be approved before they can go live. Trim and normalize, then approve."
              className="flex flex-col gap-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  variant="number"
                  label="Trim start (sec)"
                  min={0}
                  step={0.1}
                  value={trimStart}
                  onChange={(event) => setTrimStart(Number(event.target.value))}
                />
                <Input
                  type="number"
                  variant="number"
                  label="Trim end (sec, 0 = full)"
                  min={0}
                  step={0.1}
                  value={trimEnd}
                  onChange={(event) => setTrimEnd(Number(event.target.value))}
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Peak normalize / loudness (stream target)</span>
                <Toggle
                  label="Peak normalize / loudness (stream target)"
                  checked={normalize}
                  onChange={setNormalize}
                />
              </div>
              {episode.soundId ? (
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    to="/studio/sounds/$id/editor"
                    params={{ id: episode.soundId }}
                    size="sm"
                    variant="secondary"
                  >
                    Open full editor
                  </ButtonLink>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void applyTrim()}
                  >
                    {busy ? 'Rendering…' : 'Apply trim / normalize'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <ButtonLink to="/studio/go-live" size="sm">
                    <RadioIcon size={14} aria-hidden className="mr-1" />
                    Go Live to record
                  </ButtonLink>
                  <p className="text-foreground-secondary w-full text-xs">
                    After the broadcast ends, open Studio → Recordings to edit
                    and attach the saved capture, then return here to approve.
                  </p>
                </div>
              )}
              <Button
                disabled={busy || episode.status === 'APPROVED'}
                onClick={() => void approve()}
              >
                <CheckIcon size={16} aria-hidden className="mr-1.5" />
                {episode.status === 'APPROVED' ? 'Approved' : 'Approve episode'}
              </Button>
            </StudioPanel>
          )}

          {!needsApproval && (
            <section className="border-border flex flex-col gap-2 rounded-xl border p-4">
              <p className="text-sm">
                Episode #{episode.episodeNumber} is{' '}
                {episodeStatusLabel(episode)}.
              </p>
              {episode.soundId && (
                <ButtonLink
                  className="w-fit"
                  to="/studio/sounds/$id"
                  params={{ id: episode.soundId }}
                  size="sm"
                  variant="secondary"
                >
                  Open in Library
                </ButtonLink>
              )}
            </section>
          )}

          {msg && <p className="text-sm">{msg}</p>}

          <Button
            size="sm"
            variant="text"
            onClick={() =>
              void navigate({
                to: '/studio/shows/$id',
                params: { id: episode.showId },
              })
            }
          >
            Back to show
          </Button>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
