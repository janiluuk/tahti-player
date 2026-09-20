type Props = {
  displayName: string;
  bio?: string | null;
};

const PLACEHOLDER_TRACK_TITLES = [
  'Latest release',
  'Live session',
  'Featured track',
] as const;

/** Static tracks + bio preview shown below the live-editable header/player
 * in the designer's page-preview column. Never real data — placeholder
 * copy only, matching the public channel page's structure. */
export function PreviewTracksPlaceholder({ displayName, bio }: Props) {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Tracks</h3>
        </div>
        <div className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {PLACEHOLDER_TRACK_TITLES.map((title, index) => (
            <div key={title} className="flex items-center gap-3 px-3 py-3">
              <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{title}</div>
                <div className="text-foreground-secondary text-xs">
                  {displayName}
                </div>
              </div>
              <span className="text-foreground-secondary text-xs">Preview</span>
            </div>
          ))}
        </div>
      </section>
      <section className="border-border rounded-lg border p-4">
        <h3 className="text-sm font-bold">About {displayName}</h3>
        <p className="text-foreground-secondary mt-1 line-clamp-2 text-sm">
          {bio || 'Your artist bio will appear here for visitors.'}
        </p>
      </section>
    </div>
  );
}
