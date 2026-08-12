import { useEffect, useMemo, useState } from 'react';

import { Button } from '@nuclearplayer/ui';

import {
  BRAND_ACCENTS,
  fetchChannelVisual,
  HEADER_STYLES,
  parseColorScheme,
  patchChannelVisual,
  VISUAL_PRESETS,
  type ChannelVisual,
  type ColorScheme,
} from '../api/channel-design';

type Props = {
  displayName: string;
  username: string;
  channelSlug?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  /** Compact for profile tab; full for Studio. */
  compact?: boolean;
  /** Side-panel look controls only (no hero preview chrome). */
  lookOnly?: boolean;
  onSaved?: () => void;
};

export function ChannelDesigner({
  displayName,
  username,
  channelSlug,
  avatarUrl,
  bio,
  compact,
  lookOnly,
  onSaved,
}: Props) {
  const [visual, setVisual] = useState<ChannelVisual | null>(null);
  const [scheme, setScheme] = useState<ColorScheme>({});
  const [source, setSource] = useState('…');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void fetchChannelVisual().then((r) => {
      setVisual(r.data);
      setScheme(parseColorScheme(r.data.colorSchemeJson));
      setSource(r.meta.source);
    });
  }, []);

  const previewStyle = useMemo(() => {
    const accent = scheme.accent ?? '#22D3EE';
    const highlight = scheme.highlight ?? '#A78BFA';
    const bg = scheme.background ?? '#0B1220';
    const fg = scheme.foreground ?? '#F8FAFC';
    const brand = BRAND_ACCENTS.find((b) => b.id === visual?.brandAccentPreset);
    const gradient =
      visual?.headerStyle === 'SOLID'
        ? bg
        : (brand?.gradient ??
          `linear-gradient(135deg, ${highlight}, ${accent}, ${bg})`);
    return { accent, highlight, bg, fg, gradient };
  }, [scheme, visual?.brandAccentPreset, visual?.headerStyle]);

  const applyLocal = (
    next: Partial<ChannelVisual>,
    nextScheme?: ColorScheme,
  ) => {
    setVisual((v) => (v ? { ...v, ...next } : v));
    if (nextScheme) {
      setScheme(nextScheme);
    }
    setDirty(true);
  };

  const save = async () => {
    if (!visual) {
      return;
    }
    setBusy(true);
    setMsg(null);
    const result = await patchChannelVisual({
      visualPreset: visual.visualPreset,
      headerStyle: visual.headerStyle,
      brandAccentPreset: visual.brandAccentPreset,
      colorScheme: scheme,
    });
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setVisual(result.data);
    setScheme(parseColorScheme(result.data.colorSchemeJson));
    setDirty(false);
    setMsg('Look saved — public channel will pick this up.');
    onSaved?.();
  };

  if (!visual) {
    return (
      <p className="text-foreground-secondary text-sm">Loading designer…</p>
    );
  }

  const controls = (
    <>
      <section className="flex flex-col gap-2">
        <h3 className="text-foreground-secondary text-xs tracking-wide uppercase">
          Visual preset
        </h3>
        <div className="flex flex-wrap gap-2">
          {VISUAL_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyLocal({ visualPreset: p })}
              className={`rounded-md px-2.5 py-1 text-xs font-medium tracking-wide uppercase ${
                visual.visualPreset === p
                  ? 'bg-primary text-foreground'
                  : 'border-border text-foreground-secondary hover:text-foreground border'
              }`}
            >
              {p.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-foreground-secondary text-xs tracking-wide uppercase">
          Brand accent
        </h3>
        <div className="flex flex-wrap gap-2">
          {BRAND_ACCENTS.map((b) => (
            <button
              key={b.id}
              type="button"
              title={b.label}
              onClick={() =>
                applyLocal(
                  { brandAccentPreset: b.id },
                  {
                    ...scheme,
                    accent: b.accent,
                    highlight: b.highlight,
                  },
                )
              }
              className={`h-9 w-14 rounded-md border-2 ${
                visual.brandAccentPreset === b.id
                  ? 'border-primary'
                  : 'border-transparent'
              }`}
              style={{ background: b.gradient }}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-foreground-secondary text-xs tracking-wide uppercase">
          Header style
        </h3>
        <div className="flex flex-wrap gap-2">
          {HEADER_STYLES.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => applyLocal({ headerStyle: h })}
              className={`rounded-md px-2.5 py-1 text-xs font-medium tracking-wide uppercase ${
                visual.headerStyle === h
                  ? 'bg-primary text-foreground'
                  : 'border-border text-foreground-secondary hover:text-foreground border'
              }`}
            >
              {h.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['accent', 'Accent'] as const,
            ['highlight', 'Highlight'] as const,
            ['background', 'Background'] as const,
            ['foreground', 'Foreground'] as const,
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="color"
              value={scheme[key] ?? '#22D3EE'}
              onChange={(e) => {
                const next = { ...scheme, [key]: e.target.value };
                applyLocal({}, next);
              }}
              className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
            />
            <span className="text-foreground-secondary text-xs uppercase">
              {label}
            </span>
            <code className="text-foreground-secondary text-xs">
              {scheme[key]}
            </code>
          </label>
        ))}
      </section>

      <Button size="sm" disabled={busy || !dirty} onClick={() => void save()}>
        {busy ? 'Saving…' : dirty ? 'Save look' : 'Saved'}
      </Button>
      {msg && <p className="text-sm">{msg}</p>}
      <p className="text-foreground-secondary text-[10px]">Source: {source}</p>
    </>
  );

  if (lookOnly) {
    return <div className="flex flex-col gap-3">{controls}</div>;
  }

  return (
    <div className={`flex flex-col gap-4 ${compact ? '' : 'max-w-3xl'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            Design your channel
          </h2>
          <p className="text-foreground-secondary text-xs">
            Prefer editing on the live channel page — open your channel and hit
            Edit design. Source: {source}.
          </p>
        </div>
        <Button size="sm" disabled={busy || !dirty} onClick={() => void save()}>
          {busy ? 'Saving…' : dirty ? 'Save look' : 'Saved'}
        </Button>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-white/10 p-5 shadow-lg"
        style={{ background: previewStyle.gradient, color: previewStyle.fg }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: previewStyle.bg }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 text-lg font-bold"
            style={{
              borderColor: previewStyle.accent,
              background: previewStyle.bg,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl font-extrabold tracking-tight">
              {displayName}
            </div>
            <div className="text-sm opacity-80">
              @{username}
              {channelSlug ? ` · /${channelSlug}` : ''}
            </div>
            {bio && (
              <p className="mt-1 line-clamp-2 text-sm opacity-90">{bio}</p>
            )}
          </div>
          <span
            className="rounded px-2 py-1 text-[10px] font-bold tracking-wide uppercase"
            style={{ background: previewStyle.accent, color: '#0B1220' }}
          >
            {visual.visualPreset.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="relative mt-4 flex h-10 items-end gap-0.5">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm opacity-80"
              style={{
                height: `${20 + ((i * 17) % 70)}%`,
                background:
                  i % 2 === 0 ? previewStyle.accent : previewStyle.highlight,
              }}
            />
          ))}
        </div>
      </div>

      {controls}
    </div>
  );
}
