import {
  CropIcon,
  MapPinIcon,
  Maximize2Icon,
  PauseIcon,
  PlayIcon,
  Redo2Icon,
  ScanSearchIcon,
  ScissorsIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  Undo2Icon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, Toggle, Tooltip } from '@tahti-player/ui';

const Divider = () => <div className="bg-border mx-1 h-6 w-px" aria-hidden />;

function ToolButton({
  label,
  shortcut,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip content={shortcut ? `${label} (${shortcut})` : label} side="top">
      <Button
        size="icon-sm"
        variant="text"
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
        aria-keyshortcuts={shortcut}
      >
        <Icon size={16} aria-hidden />
      </Button>
    </Tooltip>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      {children}
    </div>
  );
}

export type ToolbarProps = {
  playing: boolean;
  hasSelection: boolean;
  hasCuts: boolean;
  isZoomed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  snapToZero: boolean;
  skipCuts: boolean;
  onTogglePlay: () => void;
  onPreviewSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onTrim: () => void;
  onTrimSilence: () => void;
  onFadeIn: () => void;
  onFadeOut: () => void;
  onClearCuts: () => void;
  onClearSelection: () => void;
  onAddMarker: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToSelection: () => void;
  onZoomFit: () => void;
  onSnapChange: (on: boolean) => void;
  onSkipCutsChange: (on: boolean) => void;
};

/** Transport, history, edit, fade, marker and zoom tools above the
 * waveform. Each button names its keyboard shortcut in its tooltip. */
export function WaveformToolbar(props: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Editor tools"
      className="border-border bg-background-secondary flex flex-wrap items-center gap-1 rounded-t-xl border-b px-3 py-2"
    >
      <Group label="Transport">
        <Button
          size="sm"
          onClick={props.onTogglePlay}
          aria-keyshortcuts="Space"
        >
          {props.playing ? (
            <PauseIcon size={16} aria-hidden className="mr-1.5" />
          ) : (
            <PlayIcon size={16} aria-hidden className="mr-1.5" />
          )}
          {props.playing ? 'Pause' : 'Play'}
        </Button>
        <ToolButton
          label="Preview selection"
          shortcut="P"
          icon={Volume2Icon}
          disabled={!props.hasSelection}
          onClick={props.onPreviewSelection}
        />
      </Group>

      <Divider />

      <Group label="History">
        <ToolButton
          label="Undo"
          shortcut="Control+Z"
          icon={Undo2Icon}
          disabled={!props.canUndo}
          onClick={props.onUndo}
        />
        <ToolButton
          label="Redo"
          shortcut="Control+Shift+Z"
          icon={Redo2Icon}
          disabled={!props.canRedo}
          onClick={props.onRedo}
        />
      </Group>

      <Divider />

      <Group label="Cut and trim">
        <ToolButton
          label="Cut selection"
          shortcut="Delete"
          icon={ScissorsIcon}
          disabled={!props.hasSelection}
          onClick={props.onCut}
        />
        <ToolButton
          label="Trim to selection"
          shortcut="T"
          icon={CropIcon}
          disabled={!props.hasSelection}
          onClick={props.onTrim}
        />
        <ToolButton
          label="Trim leading/trailing silence"
          icon={VolumeXIcon}
          onClick={props.onTrimSilence}
        />
        <ToolButton
          label="Clear all cuts"
          icon={Trash2Icon}
          disabled={!props.hasCuts}
          onClick={props.onClearCuts}
        />
        <ToolButton
          label="Clear selection"
          shortcut="Escape"
          icon={XIcon}
          disabled={!props.hasSelection}
          onClick={props.onClearSelection}
        />
      </Group>

      <Divider />

      <Group label="Fades">
        <ToolButton
          label="Fade in over selection"
          shortcut="I"
          icon={TrendingUpIcon}
          disabled={!props.hasSelection}
          onClick={props.onFadeIn}
        />
        <ToolButton
          label="Fade out over selection"
          shortcut="O"
          icon={TrendingDownIcon}
          disabled={!props.hasSelection}
          onClick={props.onFadeOut}
        />
      </Group>

      <Divider />

      <ToolButton
        label="Add marker at playhead"
        shortcut="M"
        icon={MapPinIcon}
        onClick={props.onAddMarker}
      />

      <Divider />

      <Group label="Zoom">
        <ToolButton
          label="Zoom out"
          shortcut="-"
          icon={ZoomOutIcon}
          onClick={props.onZoomOut}
        />
        <ToolButton
          label="Zoom in"
          shortcut="+"
          icon={ZoomInIcon}
          onClick={props.onZoomIn}
        />
        <ToolButton
          label="Zoom to selection"
          shortcut="Z"
          icon={ScanSearchIcon}
          disabled={!props.hasSelection}
          onClick={props.onZoomToSelection}
        />
        <ToolButton
          label="Show whole track"
          shortcut="0"
          icon={Maximize2Icon}
          disabled={!props.isZoomed}
          onClick={props.onZoomFit}
        />
      </Group>

      <div className="flex-1" />

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <Toggle
          label="Snap to zero"
          checked={props.snapToZero}
          onChange={props.onSnapChange}
        />
        <Toggle
          label="Skip cuts"
          checked={props.skipCuts}
          onChange={props.onSkipCutsChange}
        />
      </div>
    </div>
  );
}
