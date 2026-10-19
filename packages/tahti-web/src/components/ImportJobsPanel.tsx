import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { Badge, TrackProcessing } from '@tahti-player/ui';

import {
  fetchCloudImportJobs,
  isImportRunning,
  type CloudImportJob,
} from '../api/cloud-import-jobs';
import { usePolling } from '../hooks/usePolling';

const SOURCE_LABEL: Record<string, string> = {
  GOOGLE_DRIVE: 'Google Drive',
  SOUNDCLOUD: 'SoundCloud',
  HEARTHIS: 'hearthis.at',
};

function sourceLabel(source: string): string {
  return (
    SOURCE_LABEL[source] ??
    source.charAt(0) + source.slice(1).toLowerCase().replace(/_/g, ' ')
  );
}

function JobStatus({ job }: { job: CloudImportJob }) {
  if (job.status === 'QUEUED') {
    return <TrackProcessing label="Queued" />;
  }
  if (job.status === 'DOWNLOADING') {
    return <TrackProcessing label="Importing" />;
  }
  if (job.status === 'DONE') {
    return job.soundId ? (
      <Link
        to="/studio/sounds/$id"
        params={{ id: job.soundId }}
        className="text-accent-green-strong text-xs font-semibold hover:underline"
      >
        Imported — open track
      </Link>
    ) : (
      <span className="text-accent-green-strong text-xs font-semibold">
        Imported
      </span>
    );
  }
  return (
    <span className="text-accent-red-strong text-xs">
      Failed{job.error ? `: ${job.error}` : ''}
    </span>
  );
}

/** Recent Google Drive / SoundCloud imports and how far each got. Polls
 * while any import is still queued or downloading; hidden when there are
 * none. */
export function ImportJobsPanel() {
  const [jobs, setJobs] = useState<CloudImportJob[]>([]);
  const load = useCallback(() => {
    void fetchCloudImportJobs().then(({ data }) => setJobs(data));
  }, []);
  useEffect(load, [load]);
  usePolling(load, 5000, jobs.some(isImportRunning));

  if (jobs.length === 0) {
    return null;
  }
  return (
    <section
      aria-labelledby="import-jobs-title"
      className="border-border flex flex-col gap-2 rounded-lg border p-4"
      data-testid="import-jobs"
    >
      <h2
        id="import-jobs-title"
        className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase"
      >
        Import progress
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span className="min-w-0 flex-1 basis-48 truncate font-medium">
              {job.fileName}
            </span>
            <Badge variant="pill" color="cyan">
              {sourceLabel(job.source)}
            </Badge>
            <JobStatus job={job} />
          </li>
        ))}
      </ul>
    </section>
  );
}
