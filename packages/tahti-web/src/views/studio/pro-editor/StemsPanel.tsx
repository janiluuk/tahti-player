import { LoaderCircleIcon, SplitIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, TabLabel, Tabs } from '@tahti-player/ui';

import {
  fetchSoundStems,
  requestSoundStems,
  STEM_SET_LABELS,
  type StemJob,
  type StemSet,
} from '../../../api/studio';
import { StemPlayer } from '../../../components/StemPlayer';
import { StudioPanel } from '../../../components/StudioPanel';
import { usePolling } from '../../../hooks/usePolling';

const isRunning = (job: StemJob | undefined) =>
  job?.status === 'PENDING' || job?.status === 'PROCESSING';

/** Stem separation: request a 2- or 4-stem split, follow its progress, and
 * play the results. Owns its own job list. */
export function StemsPanel({ soundId }: { soundId: string }) {
  const [stems, setStems] = useState<StemJob[]>([]);
  const [activeStemSet, setActiveStemSet] = useState<StemSet>('TWO_STEM');
  const [requesting, setRequesting] = useState(false);
  const stemsRef = useRef(stems);
  stemsRef.current = stems;

  useEffect(() => {
    let cancelled = false;
    setStems([]);
    fetchSoundStems(soundId)
      .then((r) => {
        if (!cancelled) {
          setStems(r.data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [soundId]);

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
              <Tabs.Tab key={stemSet}>
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
              <LoaderCircleIcon
                size={14}
                aria-hidden
                className="mr-1.5 animate-spin"
              />
            ) : (
              <SplitIcon size={14} aria-hidden className="mr-1.5" />
            )}
            {busyStem ? 'Splitting…' : `Split ${setLabel.toLowerCase()}`}
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

      {stems.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No stem jobs yet — request a split above. Splits are cached for 7
          days, then cleared automatically.
        </p>
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
                <p className="text-accent-red mt-1 text-xs">
                  {job.errorMessage}
                </p>
              )}
              {job.files && job.files.length > 0 && (
                <div className="mt-2">
                  <StemPlayer files={job.files} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
