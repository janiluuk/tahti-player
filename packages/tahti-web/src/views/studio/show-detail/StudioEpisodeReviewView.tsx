import { CheckIcon, RadioIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Button,
  ButtonLink,
  EditIconButton,
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
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioGate } from '../../../components/StudioGate';
import { StudioPanel } from '../../../components/StudioPanel';
import { Eyebrow } from '../../../components/tahti/Eyebrow';
import { useEditMode } from '../../../lib/useEditMode';
import { trimToCuts } from '../episodeTrim';
import { episodeStatusLabel } from '../StudioShowsView';

export function StudioEpisodeReviewView({ episodeId }: { episodeId: string }) {
  const { t } = useTranslation('web');
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useEditMode();

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setNotFound(false);
    void (async () => {
      try {
        const r = await fetchEpisode(episodeId);
        if (cancelled) {
          return;
        }
        const reason = r.meta.source === 'api' ? (r.meta.reason ?? null) : null;
        if (reason) {
          setEpisode(null);
          setLoadError(reason);
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
          setNotFound(true);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Could not load this episode.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [episodeId, attempt]);

  if (!episode) {
    return (
      <StudioGate>
        <div className="studio-page-layout flex w-full flex-col">
          {loadError ? (
            <PageError
              title={t('loadErrors.couldNotLoadThisEpisode')}
              description={loadError}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : notFound ? (
            <PageEmpty headingLevel={1} title={t('empties.episodeNotFound')} />
          ) : (
            <PageLoading label={t('loading.loading')} />
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
      toast.error(i18n.t('web:toasts.couldNotApproveEpisode'));
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
      toast.error(i18n.t('web:toasts.couldNotQueueRender'));
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
    setEditing(false);
  };

  return (
    <StudioGate>
      <div className="studio-page-layout flex w-full flex-col gap-6">
        <ViewShell
          title={episode.title}
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <>
              <Eyebrow>Episode #{episode.episodeNumber}</Eyebrow>
              <EditIconButton
                label={t('episodeReview.editDetails')}
                editing={editing}
                onClick={() => {
                  if (!editing) {
                    setPublicTitle(episode.title);
                    setPublicDescription(episode.description);
                  }
                  setEditing(!editing);
                }}
              />
            </>
          }
          corner={
            <Tooltip
              content={`Back to ${show?.title ?? 'Show'}`}
              side="right"
              wrapperClassName={backButtonCornerClassName}
            >
              <BackButtonLink
                to="/studio/shows/$id"
                params={{ id: episode.showId }}
                aria-label={`Back to ${show?.title ?? 'Show'}`}
              />
            </Tooltip>
          }
        >
          {episode.description ? (
            <p className="text-sm">{episode.description}</p>
          ) : null}

          {editing ? (
            <StudioPanel
              title={t('episodeReview.publicShowDetails')}
              description={t('episodeReview.whatListenersSeeWhenThey')}
            >
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void savePublicDetails();
                }}
              >
                <Input
                  label={t('episodeReview.episodeTitle')}
                  value={publicTitle}
                  onChange={(event) => setPublicTitle(event.target.value)}
                />
                <Textarea
                  submitOnModEnter
                  label={t('episodeReview.description')}
                  tone="secondary"
                  value={publicDescription}
                  onChange={(event) => setPublicDescription(event.target.value)}
                  rows={4}
                />
                <div className="flex justify-end">
                  <SaveButton
                    saving={savingDetails}
                    label={t('episodeReview.savePublicDetails')}
                    type="submit"
                  />
                </div>
              </form>
            </StudioPanel>
          ) : null}

          {needsApproval && (
            <StudioPanel
              title={t('episodeReview.reviewBeforeApprove')}
              description={t('episodeReview.recordedEpisodesMustBeApproved')}
              className="flex flex-col gap-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  variant="number"
                  label={t('episodeReview.trimStartSec')}
                  min={0}
                  step={0.1}
                  value={trimStart}
                  onChange={(event) => setTrimStart(Number(event.target.value))}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  variant="number"
                  label={t('episodeReview.trimEndSec0Full')}
                  min={0}
                  step={0.1}
                  value={trimEnd}
                  onChange={(event) => setTrimEnd(Number(event.target.value))}
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {t('episodeReview.peakNormalizeLoudnessStreamTarget')}
                </span>
                <Toggle
                  label={t('episodeReview.peakNormalizeLoudnessStreamTarget')}
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
                    {t('episodeReview.openFullEditor')}
                  </ButtonLink>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void applyTrim()}
                  >
                    {busy
                      ? t('studioEpisodeReviewViewStates.rendering')
                      : t('studioEpisodeReviewViewStates.applyTrimNormalize')}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    to="/studio/go-live"
                    size="sm"
                    variant="secondary"
                  >
                    <RadioIcon size={14} aria-hidden className="mr-1" />
                    {t('episodeReview.goLiveToRecord')}
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
                {episode.status === 'APPROVED'
                  ? t('studioEpisodeReviewViewStates.approved')
                  : t('studioEpisodeReviewViewStates.approveEpisode')}
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
                  {t('episodeReview.openInLibrary')}
                </ButtonLink>
              )}
            </section>
          )}

          {msg && <p className="text-sm">{msg}</p>}

          <ButtonLink
            to="/studio/shows/$id"
            params={{ id: episode.showId }}
            size="sm"
            variant="text"
          >
            {t('episodeReview.backToShow')}
          </ButtonLink>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
