import {
  Archive,
  AudioWaveform,
  Fingerprint,
  Link2,
  Radio,
  RadioTower,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import type { IntegrationId } from '../api/sources';

/** Brand mark colors — filled tile backgrounds under white/light glyphs. */
const TILE: Record<
  IntegrationId,
  {
    bg: string;
    fg: string;
    Icon?: LucideIcon;
    brand?: 'bc' | 'sc' | 'gd' | 'mc' | 'sp';
  }
> = {
  upload: { bg: 'var(--color-primary, #6d28d9)', fg: '#fff', Icon: Upload },
  stash: { bg: '#1e293b', fg: '#e2e8f0', Icon: Archive },
  bandcamp: { bg: '#1da0c3', fg: '#fff', brand: 'bc' },
  soundcloud: { bg: '#ff5500', fg: '#fff', brand: 'sc' },
  'google-drive': { bg: '#0f172a', fg: '#fff', brand: 'gd' },
  mixcloud: { bg: '#5000ff', fg: '#fff', brand: 'mc' },
  url: { bg: '#334155', fg: '#f8fafc', Icon: Link2 },
  spotify: { bg: '#1db954', fg: '#fff', brand: 'sp' },
  // hearthis.at's own embed widget color (see hcolor in lib/embedSrc.ts) —
  // no distinctive wordmark to draw, so a plain waveform glyph stands in.
  hearthis: { bg: '#55acee', fg: '#fff', Icon: AudioWaveform },
  broadcast: { bg: '#0ea5e9', fg: '#fff', Icon: Radio },
  radio: { bg: '#7c3aed', fg: '#fff', Icon: RadioTower },
  musicbrainz: { bg: '#ba478f', fg: '#fff', Icon: Fingerprint },
};

function BrandMark({
  kind,
}: {
  kind: NonNullable<(typeof TILE)[IntegrationId]['brand']>;
}) {
  if (kind === 'bc') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[55%] w-[55%]"
        aria-hidden
        fill="currentColor"
      >
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
      </svg>
    );
  }
  if (kind === 'sc') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[58%] w-[58%]"
        aria-hidden
        fill="currentColor"
      >
        <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
      </svg>
    );
  }
  if (kind === 'gd') {
    return (
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" aria-hidden>
        <path fill="#4285F4" d="M4.5 20.25L8.25 13.5h7.5l-3.75 6.75H4.5z" />
        <path fill="#EA4335" d="M8.25 3.75h7.5L19.5 10.5H12L8.25 3.75z" />
        <path
          fill="#FBBC04"
          d="M4.5 20.25L8.25 13.5 12 10.5 8.25 3.75 1.5 15l3 5.25z"
        />
        <path
          fill="#34A853"
          d="M15.75 13.5H8.25l3.75-3 7.5 0-3.75 6.75-3.75-3.75z"
          opacity="0.9"
        />
        <path fill="#188038" d="M12 10.5l3.75 3 3.75-3L15.75 3.75 12 10.5z" />
      </svg>
    );
  }
  if (kind === 'mc') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[55%] w-[55%]"
        aria-hidden
        fill="currentColor"
      >
        <path d="M2.462 8.596l1.372 6.49h.319l1.372-6.49h2.462v6.808H6.742v-5.68l.232-.81h-.402l-1.43 6.49H2.854l-1.44-6.49h-.391l.222.81v5.68H0V8.596zM24 8.63v1.429L21.257 12 24 13.941v1.43l-3.235-2.329h-.348l-3.226 2.329v-1.43l2.734-1.94-2.733-1.942V8.63l3.225 2.338h.348zm-7.869 2.75v1.24H9.304v-1.24z" />
      </svg>
    );
  }
  // spotify
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[55%] w-[55%]"
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

type Props = {
  id: IntegrationId;
  /** Larger mark for Card tile faces */
  size?: 'tile' | 'detail';
};

export function SourceServiceIcon({ id, size = 'tile' }: Props): ReactNode {
  const cfg = TILE[id];
  const dim = size === 'tile' ? 'h-full w-full' : 'h-16 w-16';
  return (
    <div
      className={`${dim} flex items-center justify-center`}
      style={{ background: cfg.bg, color: cfg.fg }}
      aria-hidden
    >
      {id === 'hearthis' ? (
        <img
          src="/assets/hearthis-logo.svg"
          alt=""
          className="h-[68%] w-[84%] brightness-0 invert"
        />
      ) : cfg.brand ? (
        <BrandMark kind={cfg.brand} />
      ) : cfg.Icon ? (
        <cfg.Icon
          size={size === 'tile' ? 56 : 32}
          absoluteStrokeWidth
          strokeWidth={1.5}
          className="opacity-95"
        />
      ) : null}
    </div>
  );
}

export function sourceTileSubtitle(id: IntegrationId): string {
  switch (id) {
    case 'upload':
      return 'Local files → archive';
    case 'stash':
      return 'Private locker';
    case 'bandcamp':
      return 'Import albums';
    case 'soundcloud':
      return 'Import tracks';
    case 'google-drive':
      return 'Cloud import';
    case 'mixcloud':
      return 'Mix rescue';
    case 'url':
      return 'DSP paste';
    case 'spotify':
      return 'Search & queue';
    case 'hearthis':
      return 'Search & embed';
    case 'broadcast':
      return 'Live captures';
    case 'radio':
      return 'M3U / stream URL';
    case 'musicbrainz':
      return 'Release/artist metadata';
    default:
      return '';
  }
}
