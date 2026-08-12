import { useEffect, useState } from 'react';

import { Link } from '@tanstack/react-router';

import {
  fetchStatsSummary,
  fetchStatsTopCountries,
  fetchStatsTopTracks,
  type StatsSummary,
  type StatsTopCountry,
  type StatsTopTrack,
} from '../../api/studio-extras';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';

export function StudioStatsView() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [tracks, setTracks] = useState<StatsTopTrack[]>([]);
  const [countries, setCountries] = useState<StatsTopCountry[]>([]);
  const [source, setSource] = useState('…');

  useEffect(() => {
    void Promise.all([
      fetchStatsSummary(),
      fetchStatsTopTracks(),
      fetchStatsTopCountries(),
    ]).then(([s, t, c]) => {
      setSummary(s.data);
      setTracks(t.data);
      setCountries(c.data);
      setSource(s.meta.source);
    });
  }, []);

  return (
    <StudioGate>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <StudioNav current="/studio/stats" />
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Stats
          </h1>
          <p className="text-foreground-secondary mt-1 text-sm">
            Plays / downloads lite from <code>/api/me/stats/*</code>. Source:{' '}
            {source}. Fan revenue payouts stay on production financial tools.
          </p>
          <p className="mt-2">
            <Link
              to="/studio/stats/detail"
              className="text-primary text-sm font-medium underline-offset-2 hover:underline"
            >
              Plays & listeners detail →
            </Link>
          </p>
        </div>

        {summary && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['Plays today', summary.playsToday],
                ['Plays total', summary.playsTotal],
                ['Downloads today', summary.downloadsToday],
                ['Downloads total', summary.downloadsTotal],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="border-border rounded-xl border p-4">
                <div className="text-foreground-secondary text-xs uppercase">
                  {label}
                </div>
                <div className="font-display mt-1 text-2xl font-bold">
                  {value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Top tracks</h2>
          {tracks.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No track stats yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {tracks.map((t) => (
                <li
                  key={t.archiveItemId}
                  className="border-border flex justify-between gap-2 rounded border px-3 py-2 text-sm"
                >
                  <span>{t.title}</span>
                  <span className="text-foreground-secondary">
                    {t.plays} plays
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Top countries</h2>
          {countries.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No country data yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {countries.map((c) => (
                <li
                  key={c.country}
                  className="border-border flex justify-between gap-2 rounded border px-3 py-2 text-sm"
                >
                  <span>{c.country}</span>
                  <span className="text-foreground-secondary">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StudioGate>
  );
}
