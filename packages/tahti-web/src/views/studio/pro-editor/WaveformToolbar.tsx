import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
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

import { useTranslation } from '@tahti-player/i18n';
import { Button, Toggle, Tooltip } from '@tahti-player/ui';

const Divider = () => <div className="bg-border mx-1 h-6 w-px" aria-hidden />;

function ToolButton({
  label,
  shortcut,
  icon: Icon,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  disabled?: boolean;
  danger?: boolean;
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
        <Icon
          size={16}
          aria-hidden
          className={danger ? 'text-accent-red' : undefined}
        />
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

function LabeledToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <Tooltip content={hint} side="top">
      <div className="flex items-center gap-2">
        <span className="text-foreground-secondary">{label}</span>
        <Toggle label={label} checked={checked} onChange={onChange} />
      </div>
    </Tooltip>
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
  onSelectionStart: () => void;
  onSelectionEnd: () => void;
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
  const { t } = useTranslation('web');
  return (
    <div
      role="toolbar"
      aria-label={t('waveformToolbar.editorTools')}
      className="border-border bg-background-secondary flex flex-wrap items-center gap-1 rounded-t-xl border-b px-3 py-2"
    >
      <Group label={t('waveformToolbar.transport')}>
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
          label={t('waveformToolbar.previewSelection')}
          shortcut="P"
          icon={Volume2Icon}
          disabled={!props.hasSelection}
          onClick={props.onPreviewSelection}
        />
      </Group>

      <Divider />

      <Group label={t('waveformToolbar.history')}>
        <ToolButton
          label={t('waveformToolbar.undo')}
          shortcut="Control+Z"
          icon={Undo2Icon}
          disabled={!props.canUndo}
          onClick={props.onUndo}
        />
        <ToolButton
          label={t('waveformToolbar.redo')}
          shortcut="Control+Shift+Z"
          icon={Redo2Icon}
          disabled={!props.canRedo}
          onClick={props.onRedo}
        />
      </Group>

      <Divider />

      <Group label={t('waveformToolbar.selection')}>
        <ToolButton
          label={t('waveformToolbar.startSelectionAtPlayhead')}
          shortcut="["
          icon={ArrowLeftToLineIcon}
          onClick={props.onSelectionStart}
        />
        <ToolButton
          label={t('waveformToolbar.endSelectionAtPlayhead')}
          shortcut="]"
          icon={ArrowRightToLineIcon}
          onClick={props.onSelectionEnd}
        />
      </Group>

      <Divider />

      <Group label={t('waveformToolbar.cutAndTrim')}>
        <ToolButton
          label={t('waveformToolbar.cutSelection')}
          shortcut="Delete"
          icon={ScissorsIcon}
          disabled={!props.hasSelection}
          onClick={props.onCut}
        />
        <ToolButton
          label={t('waveformToolbar.trimToSelection')}
          shortcut="T"
          icon={CropIcon}
          disabled={!props.hasSelection}
          onClick={props.onTrim}
        />
        <ToolButton
          label={t('waveformToolbar.trimLeadingTrailingSilence')}
          icon={VolumeXIcon}
          onClick={props.onTrimSilence}
        />
        <ToolButton
          label={t('waveformToolbar.clearAllCuts')}
          icon={Trash2Icon}
          danger
          disabled={!props.hasCuts}
          onClick={props.onClearCuts}
        />
        <ToolButton
          label={t('waveformToolbar.clearSelection')}
          shortcut="Escape"
          icon={XIcon}
          disabled={!props.hasSelection}
          onClick={props.onClearSelection}
        />
      </Group>

      <Divider />

      <Group label={t('waveformToolbar.fades')}>
        <ToolButton
          label={t('waveformToolbar.fadeInOverSelection')}
          shortcut="I"
          icon={TrendingUpIcon}
          disabled={!props.hasSelection}
          onClick={props.onFadeIn}
        />
        <ToolButton
          label={t('waveformToolbar.fadeOutOverSelection')}
          shortcut="O"
          icon={TrendingDownIcon}
          disabled={!props.hasSelection}
          onClick={props.onFadeOut}
        />
      </Group>

      <Divider />

      <ToolButton
        label={t('waveformToolbar.addMarkerAtPlayhead')}
        shortcut="M"
        icon={MapPinIcon}
        onClick={props.onAddMarker}
      />

      <Divider />

      <Group label={t('waveformToolbar.zoom')}>
        <ToolButton
          label={t('waveformToolbar.zoomOut')}
          shortcut="-"
          icon={ZoomOutIcon}
          onClick={props.onZoomOut}
        />
        <ToolButton
          label={t('waveformToolbar.zoomIn')}
          shortcut="+"
          icon={ZoomInIcon}
          onClick={props.onZoomIn}
        />
        <ToolButton
          label={t('waveformToolbar.zoomToSelection')}
          shortcut="Z"
          icon={ScanSearchIcon}
          disabled={!props.hasSelection}
          onClick={props.onZoomToSelection}
        />
        <ToolButton
          label={t('waveformToolbar.showWholeTrack')}
          shortcut="0"
          icon={Maximize2Icon}
          disabled={!props.isZoomed}
          onClick={props.onZoomFit}
        />
      </Group>

      <div className="flex-1" />

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <LabeledToggle
          label={t('waveformToolbar.snapToZero')}
          hint={t('waveformToolbar.moveSelectionEdgesToThe')}
          checked={props.snapToZero}
          onChange={props.onSnapChange}
        />
        <LabeledToggle
          label={t('waveformToolbar.skipCuts')}
          hint={t('waveformToolbar.jumpOverCutRegionsDuring')}
          checked={props.skipCuts}
          onChange={props.onSkipCutsChange}
        />
      </div>
    </div>
  );
}
