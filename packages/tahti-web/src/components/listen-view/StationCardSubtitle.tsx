import { stationNowPlayingSource } from '../../content/radioStations';
import { useStationNowPlaying } from '../../hooks/useStationNowPlaying';

export function StationCardSubtitle({
  source,
  fallback,
}: {
  source: ReturnType<typeof stationNowPlayingSource>;
  fallback: string;
}) {
  const nowPlaying = useStationNowPlaying(
    source?.programmingUrl,
    source?.streamUrl,
  );
  if (nowPlaying) {
    return (
      <span className="flex flex-col gap-0.5">
        <span className="text-accent-green-strong text-[0.65rem] font-semibold tracking-wide uppercase sm:hidden">
          Now
        </span>
        <span className="text-foreground-secondary line-clamp-2 sm:line-clamp-1">
          {nowPlaying}
        </span>
      </span>
    );
  }
  return <span className="text-foreground-secondary">{fallback}</span>;
}
