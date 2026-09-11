import { MapPinIcon } from 'lucide-react';
import { useMemo, type FC } from 'react';

import worldCountryPaths from './worldCountryPaths.json';

export type ListenerGeoPoint = {
  countryCode: string;
  displayName: string;
  count: number;
};

type WorldCountry = {
  code: string;
  d: string;
  cx: number;
  cy: number;
};

const MAP_WIDTH = worldCountryPaths.width;
const MAP_HEIGHT = worldCountryPaths.height;
const COUNTRIES = worldCountryPaths.countries as WorldCountry[];
const COUNTRY_BY_CODE = new Map(
  COUNTRIES.map((country) => [country.code, country]),
);
const MAX_COUNTRIES = 10;

export type ListenerWorldMapProps = {
  data: ListenerGeoPoint[];
  loading?: boolean;
  countLabel?: string;
  compact?: boolean;
};

export const ListenerWorldMap: FC<ListenerWorldMapProps> = ({
  data,
  loading = false,
  countLabel = 'listeners',
  compact = false,
}) => {
  const maxCount = Math.max(1, ...data.map((point) => point.count));
  const countsByCode = useMemo(() => {
    const map = new Map<string, ListenerGeoPoint>();
    for (const point of data) {
      map.set(point.countryCode, point);
    }
    return map;
  }, [data]);
  const topCountries = useMemo(
    () => [...data].sort((first, second) => second.count - first.count),
    [data],
  );
  const plotted = useMemo(
    () =>
      data
        .map((point) => {
          const country = COUNTRY_BY_CODE.get(point.countryCode);
          if (!country) {
            return null;
          }
          return { point, country };
        })
        .filter(
          (
            entry,
          ): entry is { point: ListenerGeoPoint; country: WorldCountry } =>
            entry != null,
        ),
    [data],
  );

  return (
    <div className="flex flex-col gap-3" aria-busy={loading}>
      <div
        className={`border-border bg-background relative overflow-hidden rounded-xl border ${compact ? 'max-h-44' : ''}`}
        role="img"
        aria-label="Listener world map"
      >
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className={compact ? 'h-40 w-full' : 'w-full'}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className="fill-background"
          />
          <g className="stroke-border" strokeWidth={0.6} strokeLinejoin="round">
            {COUNTRIES.map((country) => {
              const point = countsByCode.get(country.code);
              const fillOpacity = point
                ? 0.22 + Math.sqrt(point.count / maxCount) * 0.58
                : undefined;
              return (
                <path
                  key={country.code}
                  d={country.d}
                  className={
                    point
                      ? 'fill-accent-cyan stroke-accent-cyan/50'
                      : 'fill-background-secondary'
                  }
                  fillOpacity={fillOpacity}
                >
                  {point ? (
                    <title>
                      {point.displayName}: {point.count.toLocaleString()}{' '}
                      {countLabel}
                    </title>
                  ) : null}
                </path>
              );
            })}
          </g>
          {plotted.map(({ point, country }) => {
            const radius = 5 + Math.sqrt(point.count / maxCount) * 14;
            return (
              <g key={`bubble-${point.countryCode}`}>
                <circle
                  cx={country.cx}
                  cy={country.cy}
                  r={radius + 5}
                  className="fill-accent-cyan/20"
                />
                <circle
                  cx={country.cx}
                  cy={country.cy}
                  r={radius}
                  className="fill-accent-cyan stroke-background"
                  strokeWidth="2"
                >
                  <title>
                    {point.displayName}: {point.count.toLocaleString()}{' '}
                    {countLabel}
                  </title>
                </circle>
              </g>
            );
          })}
        </svg>
        {loading ? (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center text-sm font-medium">
            Updating map…
          </div>
        ) : null}
      </div>

      {topCountries.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No listener location data yet.
        </p>
      ) : (
        <ol
          className={
            compact ? 'flex flex-col gap-1' : 'grid gap-2 sm:grid-cols-2'
          }
        >
          {topCountries
            .slice(0, compact ? 5 : MAX_COUNTRIES)
            .map((point, index) => (
              <li
                key={point.countryCode}
                className={`border-border flex items-center gap-2 rounded-lg border text-sm ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
              >
                <span className="text-foreground-secondary w-5 text-xs tabular-nums">
                  {index + 1}
                </span>
                <MapPinIcon
                  size={14}
                  aria-hidden
                  className="text-accent-cyan"
                />
                <span className="min-w-0 flex-1 truncate">
                  {point.displayName}
                </span>
                <strong className="tabular-nums">
                  {point.count.toLocaleString()}
                </strong>
              </li>
            ))}
        </ol>
      )}
    </div>
  );
};
