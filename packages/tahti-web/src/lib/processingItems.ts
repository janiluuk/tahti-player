import type { ProcessingJob } from '../stores/processingJobsStore';

export type ArchiveProcessingSource = {
  id: string;
  title: string;
  status: string;
};

/** Merge local upload jobs with archive PENDING/PROCESSING rows (TopNav + Status Bar). */
export function mergeProcessingItems(
  localJobs: ProcessingJob[],
  archiveItems: ArchiveProcessingSource[],
): ProcessingJob[] {
  const fromArchive = archiveItems
    .filter((item) => item.status === 'PENDING' || item.status === 'PROCESSING')
    .map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status as 'PENDING' | 'PROCESSING',
    }));
  return [...localJobs, ...fromArchive].filter(
    (job, index, jobs) =>
      jobs.findIndex((candidate) => candidate.id === job.id) === index,
  );
}

/** Status Bar fills the bottom slot only when the compact player would not. */
export function shouldShowConnectedStatusBar(opts: {
  signedIn: boolean;
  playerBarVisible: boolean;
  hasPlayable: boolean;
  fullScreenPlayerOpen: boolean;
}): boolean {
  if (!opts.signedIn || opts.fullScreenPlayerOpen) {
    return false;
  }
  const compactPlayerShowing = opts.playerBarVisible && opts.hasPlayable;
  return !compactPlayerShowing;
}

export function encodingStatusLabel(jobs: ProcessingJob[]): string | null {
  if (jobs.length === 0) {
    return null;
  }
  if (jobs.length === 1) {
    return `Encoding “${jobs[0]!.title}”…`;
  }
  return `Encoding ${jobs.length} tracks…`;
}
