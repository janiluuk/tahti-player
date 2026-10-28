import { useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, CalendarPlusIcon, SaveIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  ButtonLink,
  Input,
  Loader,
  Select,
  Textarea,
  ViewShell,
} from '@tahti-player/ui';

import {
  createListeningParty,
  fetchListeningParty,
  LISTENING_PARTY_HOST_NOTE_MAX,
  updateListeningParty,
} from '../../api/listening-parties';
import { fetchStudioReleases } from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';
import { PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../lib/datetimeLocal';

const MIN_LEAD_MS = 5 * 60_000;

/** Schedule a listening party for a release (`releaseId` preselects it),
 * or reschedule one when `partyId` is given. */
export function StudioListeningPartyFormView({
  partyId,
  releaseId: initialReleaseId,
}: {
  partyId?: string;
  releaseId?: string;
} = {}) {
  const navigate = useNavigate();
  const editing = partyId !== undefined;
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [releaseId, setReleaseId] = useState(initialReleaseId ?? '');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [hostNote, setHostNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    if (partyId !== undefined) {
      void fetchListeningParty(partyId).then(({ data, meta, notFound }) => {
        if (cancelled) {
          return;
        }
        if (!data) {
          if (notFound) {
            toast.error('That listening party could not be found.');
            void navigate({ to: '/studio/listening-parties' });
            return;
          }
          setLoadError(meta.reason ?? 'Could not load the listening party');
          setLoading(false);
          return;
        }
        setReleaseId(data.release.id);
        setReleaseTitle(data.release.title);
        setStartAt(toDatetimeLocalValue(data.startAt));
        setHostNote(data.hostNote ?? '');
        setLoading(false);
      });
    } else {
      void fetchStudioReleases().then(({ data, meta }) => {
        if (cancelled) {
          return;
        }
        const withTracks = data.releases.filter(
          (release) =>
            (release.tracks?.length ?? release._count?.tracks ?? 0) > 0,
        );
        setReleases(withTracks);
        if (meta.source === 'api' && meta.reason && withTracks.length === 0) {
          setLoadError(meta.reason);
        }
        setLoading(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [partyId, attempt, navigate]);

  const startIso = fromDatetimeLocalValue(startAt);
  const tooSoon =
    startIso !== null &&
    new Date(startIso).getTime() < Date.now() + MIN_LEAD_MS;
  const canSubmit = Boolean(releaseId && startIso && !tooSoon && !busy);

  const submit = async () => {
    if (!startIso) {
      return;
    }
    setBusy(true);
    const note = hostNote.trim();
    const result =
      partyId === undefined
        ? await createListeningParty({
            releaseId,
            startAt: startIso,
            ...(note ? { hostNote: note } : {}),
          })
        : await updateListeningParty(partyId, {
            startAt: startIso,
            hostNote: note || null,
          });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      editing
        ? `Rescheduled the ${result.data.release.title} listening party.`
        : `Scheduled a listening party for ${result.data.release.title}.`,
    );
    void navigate({ to: '/studio/listening-parties' });
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title={
            editing ? 'Reschedule listening party' : 'Schedule listening party'
          }
          subtitle="Everyone hears the release once, start to finish, at the same time."
          classes={{ root: 'px-0 pt-0' }}
        >
          <StudioPanel title="Party details">
            {loading ? (
              <PageLoading label="Loading…" />
            ) : loadError ? (
              <PageError
                title="Could not load"
                description={loadError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canSubmit) {
                    void submit();
                  }
                }}
              >
                {editing ? (
                  <p className="text-sm">
                    <span className="text-foreground-secondary">Release </span>
                    <span className="font-medium">{releaseTitle}</span>
                  </p>
                ) : (
                  <Select
                    id="listening-party-release"
                    label="Release"
                    placeholder={
                      releases.length === 0
                        ? 'Add tracks to a release first'
                        : 'Choose a release'
                    }
                    value={releaseId || undefined}
                    options={releases.map((release) => ({
                      id: release.id,
                      label: `${release.title} · ${release.type.toLowerCase()}`,
                    }))}
                    onValueChange={setReleaseId}
                  />
                )}
                <Input
                  type="datetime-local"
                  label="Starts"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  error={
                    tooSoon ? 'Start at least 5 minutes from now.' : undefined
                  }
                />
                <Textarea
                  submitOnModEnter
                  label="Note to listeners (optional)"
                  value={hostNote}
                  maxLength={LISTENING_PARTY_HOST_NOTE_MAX}
                  onChange={(event) => setHostNote(event.target.value)}
                  rows={4}
                  placeholder="What to expect, what to listen for, when you will be in the chat…"
                />
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    to="/studio/listening-parties"
                    size="sm"
                    variant="secondary"
                  >
                    <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
                    Cancel
                  </ButtonLink>
                  <Button size="sm" type="submit" disabled={!canSubmit}>
                    {busy ? (
                      <Loader size="sm" shape="circle" className="mr-1.5" />
                    ) : editing ? (
                      <SaveIcon size={16} aria-hidden className="mr-1.5" />
                    ) : (
                      <CalendarPlusIcon
                        size={16}
                        aria-hidden
                        className="mr-1.5"
                      />
                    )}
                    {editing ? 'Save changes' : 'Schedule party'}
                  </Button>
                </div>
              </form>
            )}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
