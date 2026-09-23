import { Link } from '@tanstack/react-router';

import { Button } from '@tahti-player/ui';

import { type TopNavState } from './useTopNavState';

export function ProcessingIndicator({ nav }: { nav: TopNavState }) {
  const { processingOpen, setProcessingOpen, processingItems } = nav;

  return (
    <div className="relative">
      <Button
        variant="text"
        size="icon-sm"
        className="border-accent-blue/50 bg-accent-blue/10 text-accent-blue inline-flex size-7 items-center justify-center rounded-full border active:scale-100"
        aria-label={`${processingItems.length} track${processingItems.length === 1 ? '' : 's'} processing`}
        aria-expanded={processingOpen}
        title="Track processing status"
        onClick={() => setProcessingOpen((current) => !current)}
      >
        <span className="bg-accent-blue size-2 rounded-full motion-safe:animate-pulse" />
      </Button>
      {processingOpen ? (
        <div className="border-border bg-background absolute top-[calc(100%+8px)] left-0 z-40 w-72 rounded-lg border p-2 shadow-lg">
          <p className="text-foreground-secondary px-2 py-1 text-[11px] font-semibold tracking-wide uppercase">
            Processing tracks
          </p>
          <ul className="flex flex-col gap-1">
            {processingItems.map((item) => (
              <li key={item.id}>
                <Link
                  to="/studio/sounds/$id"
                  params={{ id: item.id }}
                  className="hover:bg-background-secondary flex items-center justify-between gap-3 rounded-md px-2 py-2 text-xs"
                  onClick={() => setProcessingOpen(false)}
                >
                  <span className="min-w-0 truncate">{item.title}</span>
                  <span className="text-accent-blue shrink-0">
                    {item.status === 'PENDING' ? 'Queued' : 'Processing'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-foreground-secondary px-2 pt-2 text-[11px]">
            This status updates automatically. You’ll get a notification when a
            track is ready.
          </p>
        </div>
      ) : null}
    </div>
  );
}
