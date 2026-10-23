import { LayersIcon, SplitIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, InlineError, Loader, TabLabel, Tabs } from '@tahti-player/ui';

import {
  fetchSoundStems,
  requestSoundStems,
  STEM_SET_LABELS,
  type StemJob,
  type StemSet,
} from '../../../api/studio';
import { PageEmpty, PageError } from '../../../components/PageStates';
import { StemMixer } from '../../../components/StemMixer';
import { StudioPanel } from '../../../components/StudioPanel';
import { usePolling } from '../../../hooks/usePolling';

const isRunning = (job: StemJob | undefined) =>
  job?.status === 'PENDING' || job?.status === 'PROCESSING';

/** Stem separation: request a 2- or 4-stem split, follow its progress, and
 * play the results. Owns its own job list. */
export function StemsPanel({
  soundId,
  onSendToMultitrack,
}: {
  soundId: string;
  /** When set, READY jobs offer “Send to Multitrack” (one lane per stem). */
  onSendToMultitrack?: (job: StemJob) => void | Promise<void>;
}) {
  const [stems, setStems] = useState<StemJob[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeStemSet, setActiveStemSet] = useState<StemSet>('TWO_STEM');
  const [requesting, setRequesting] = useState(false);
  const stemsRef = useRef(stems);
  stemsRef.current = stems;

  useEffect(() => {
    let cancelled = false;
    setStems([]);
    setLoadError(null);
    void fetchSoundStems(soundId).then((r) => {
      if (!cancelled) {
        setStems(r.data);
        setLoadError(r.meta.source === 'api' ? (r.meta.reason ?? null) : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [soundId, loadAttempt]);

  // Separation runs on a GPU worker and can take a while — poll until every
  // requested job has left PENDING/PROCESSING rather than making the user
  // refresh to see when a split is ready.
  usePolling(
    () => {
      fetchSoundStems(soundId)
        .then((r) => {
          for (const next of r.data) {
            const prev = stemsRef.current.find(
              (s) => s.stemSet === next.stemSet,
            );
            const label =
              STEM_SET_LABELS[next.stemSet as StemSet] ?? next.stemSet;
            if (isRunning(prev) && next.status === 'READY') {
              toast.success(`${label} split ready.`);
            } else if (isRunning(prev) && next.status === 'ERROR') {
              toast.error(next.errorMessage || `${label} split failed.`);
            }
          }
          setStems(r.data);
        })
        .catch(() => undefined);
    },
    4000,
    stems.some(isRunning),
  );

  const existing = stems.find((s) => s.stemSet === activeStemSet);
  const busyStem = requesting || isRunning(existing);
  const setLabel = STEM_SET_LABELS[activeStemSet];
  const [sendingSet, setSendingSet] = useState<string | null>(null);

  const sendJob = async (job: StemJob) => {
    if (!onSendToMultitrack || !job.files?.length) {
      return;
    }
    setSendingSet(job.stemSet);
    try {
      await onSendToMultitrack(job);
    } finally {
      setSendingSet(null);
    }
  };

  const requestSplit = async () => {
    setRequesting(true);
    toast.info(`Splitting into ${setLabel.toLowerCase()}…`);
    try {
      const result = await requestSoundStems(soundId, activeStemSet);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStems((await fetchSoundStems(soundId)).data);
    } catch {
      toast.error('Could not request the split. Try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <StudioPanel title="Stems">
      <div className="mb-4 flex flex-col gap-2">
        <Tabs.Root
          selectedIndex={activeStemSet === 'FOUR_STEM' ? 1 : 0}
          onChange={(index) =>
            setActiveStemSet(index === 1 ? 'FOUR_STEM' : 'TWO_STEM')
          }
        >
          <Tabs.List className="w-fit">
            {(['TWO_STEM', 'FOUR_STEM'] as const).map((stemSet) => (
              <Tabs.Tab
                key={stemSet}
                className="h-auto min-h-8 py-1 text-left whitespace-normal"
              >
                <TabLabel
                  icon={<SplitIcon size={14} />}
                  count={stemSet === 'TWO_STEM' ? 2 : 4}
                >
                  {STEM_SET_LABELS[stemSet]}
                </TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            disabled={busyStem}
            className="self-start"
            onClick={() => void requestSplit()}
          >
            {busyStem ? (
              <Loader size="inline" shape="circle" className="mr-1.5" />
            ) : (
              <SplitIcon size={14} aria-hidden className="mr-1.5" />
            )}
            {busyStem ? 'Splitting…' : 'Split into stems'}
          </Button>
          {busyStem && (
            <div
              className="bg-background-secondary relative h-1.5 w-48 overflow-hidden rounded-full"
              role="progressbar"
              aria-label={`Splitting into ${setLabel}`}
            >
              <div className="bg-primary absolute inset-0 w-1/3 animate-pulse rounded-full" />
            </div>
          )}
        </div>
      </div>

      {loadError && stems.length === 0 ? (
        <PageError
          title="Could not load stem jobs"
          description={loadError}
          onRetry={() => setLoadAttempt((n) => n + 1)}
        />
      ) : stems.length === 0 ? (
        <PageEmpty
          title="No stem jobs yet — request a split above."
          description="Splits are cached for 7 days, then cleared automatically."
        />
      ) : (
        <ul className="divide-border divide-y">
          {stems.map((job) => (
            <li
              key={job.stemSet}
              className="py-2.5 text-sm first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {STEM_SET_LABELS[job.stemSet as StemSet] ?? job.stemSet}
                </span>
                <span className="text-foreground-secondary font-mono text-xs uppercase">
                  {job.status}
                </span>
              </div>
              {job.status === 'ERROR' && job.errorMessage && (
                <InlineError textSize="xs" className="mt-1" announce={false}>
                  {job.errorMessage}
                </InlineError>
              )}
              {job.files && job.files.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  <StemMixer files={job.files} />
                  {onSendToMultitrack && job.status === 'READY' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="self-start"
                      disabled={sendingSet === job.stemSet}
                      onClick={() => void sendJob(job)}
                    >
                      {sendingSet === job.stemSet ? (
                        <Loader
                          size="inline"
                          shape="circle"
                          className="mr-1.5"
                        />
                      ) : (
                        <LayersIcon size={14} aria-hidden className="mr-1.5" />
                      )}
                      {sendingSet === job.stemSet
                        ? 'Loading lanes…'
                        : 'Send to Multitrack'}
                    </Button>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
