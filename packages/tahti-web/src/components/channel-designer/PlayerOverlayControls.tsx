import { CheckIcon, SettingsIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import type {
  TextOverlayAlign,
  TextOverlayMode,
} from '../../api/channel-design';
import {
  NOW_PLAYING_OVERLAY_PRESETS,
  resolveNowPlayingOverlayPreset,
  type NowPlayingOverlayPresetId,
  type NowPlayingOverlaySettings,
} from '../../content/nowPlayingOverlayPresets';
import { ChannelTextOverlayEditor } from '../ChannelTextOverlayEditor';
import { ChannelTextOverlayView } from '../ChannelTextOverlayView';
import { NowPlayingOverlay } from '../NowPlayingOverlay';
import { Eyebrow } from '../tahti/Eyebrow';

type TextOverlayValue = {
  mode: TextOverlayMode | string;
  text: string;
  align: TextOverlayAlign | string;
};

type PreviewColors = {
  bg: string;
  accent: string;
  highlight: string;
};

type Props = {
  playerOverlay: TextOverlayValue;
  onPlayerOverlayChange: (next: TextOverlayValue) => void;
  previewStyle: PreviewColors;
  nowPlayingStyle: string | null | undefined;
  onNowPlayingStyleChange: (id: NowPlayingOverlayPresetId) => void;
  overlaySettings: NowPlayingOverlaySettings;
  displayName: string;
  avatarUrl?: string | null;
  onConfigureText: () => void;
};

/** Player → Overlay: stage text layer + now-playing layout presets. */
export function PlayerOverlayControls({
  playerOverlay,
  onPlayerOverlayChange,
  previewStyle,
  nowPlayingStyle,
  onNowPlayingStyleChange,
  overlaySettings,
  displayName,
  avatarUrl,
  onConfigureText,
}: Props) {
  const activePresetId = resolveNowPlayingOverlayPreset(nowPlayingStyle);

  return (
    <div className="flex flex-col gap-5" data-testid="channel-player-overlay">
      <div className="flex flex-col gap-3">
        <Eyebrow>Stage overlay</Eyebrow>
        <ChannelTextOverlayEditor
          value={playerOverlay}
          onChange={onPlayerOverlayChange}
        />
        <div
          className="relative flex min-h-24 items-center overflow-hidden rounded-lg border border-white/10 p-4"
          style={{ background: previewStyle.bg }}
        >
          <ChannelTextOverlayView
            mode={playerOverlay.mode}
            text={playerOverlay.text}
            align={playerOverlay.align}
            accent={previewStyle.accent}
            highlight={previewStyle.highlight}
            size="sm"
            className="w-full"
          />
          {!playerOverlay.text?.trim() && (
            <p className="text-foreground-secondary text-xs">
              Preview — enter text above to see it on the player stage.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Now playing</Eyebrow>
          <Button size="sm" variant="secondary" onClick={onConfigureText}>
            <SettingsIcon size={14} aria-hidden />
            Configure text
          </Button>
        </div>
        <p className="text-foreground-secondary text-xs">
          How the title and artist sit over live audio or an archive track.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {NOW_PLAYING_OVERLAY_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => onNowPlayingStyleChange(preset.id)}
                className={`flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 ring-primary ring-1'
                    : 'border-border bg-background hover:bg-background-secondary'
                }`}
              >
                <div
                  className="relative flex aspect-video items-end overflow-hidden rounded-md bg-cover bg-center p-2"
                  style={{
                    backgroundColor: '#0B1220',
                    backgroundImage: avatarUrl
                      ? `url(${avatarUrl})`
                      : undefined,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="relative w-full">
                    <NowPlayingOverlay
                      presetId={preset.id}
                      title="Sample Track"
                      artist={displayName}
                      artworkUrl={avatarUrl}
                      compact
                      settings={overlaySettings}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    {preset.name}
                    {active ? (
                      <CheckIcon
                        size={14}
                        className="text-primary"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <p className="text-foreground-secondary text-xs">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
