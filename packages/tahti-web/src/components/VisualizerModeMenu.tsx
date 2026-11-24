import { AudioWaveformIcon, CheckIcon } from 'lucide-react';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import { Button, Popover } from '@tahti-player/ui';
import {
  ADVANCED_MODES,
  CYMATICS_MODES,
  type VisualizerMode,
} from '@tahti-player/visualizer';

import {
  AMBIENT_SCENES,
  isAmbientScene,
  type AmbientScene,
  type PlayerScene,
} from '../lib/channelVizPreset';
import { visualizerModeLabel } from '../lib/visualizerModeLabel';
import { VisualizerModePreview } from './VisualizerModePreview';

type Props = {
  mode: PlayerScene;
  onModeChange: (mode: PlayerScene) => void;
  triggerClassName?: string;
  panelClassName?: string;
};

const AMBIENT_LABEL_KEYS = {
  'ambient-glow': 'visualizerModeMenu.ambientGlow',
  'ambient-water': 'visualizerModeMenu.ambientWater',
} as const satisfies Record<AmbientScene, ParseKeys<'web'>>;

/** Small static tile hinting at each cover-art scene. */
function AmbientScenePreview({ scene }: { scene: AmbientScene }) {
  return scene === 'ambient-glow' ? (
    <span
      aria-hidden
      className="block aspect-video w-full rounded-md bg-neutral-900 bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.75),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(129,140,248,0.7),transparent_55%)]"
    />
  ) : (
    <span
      aria-hidden
      className="flex aspect-video w-full flex-col overflow-hidden rounded-md"
    >
      <span className="block h-[58%] bg-gradient-to-b from-sky-300 via-amber-200 to-emerald-700" />
      <span className="block h-[42%] bg-gradient-to-b from-emerald-900 via-sky-900 to-slate-950" />
    </span>
  );
}

const GROUPS = [
  {
    id: 'analyzer',
    labelKey: 'visualizerModeMenuBatch36.analyzer',
    modes: ADVANCED_MODES,
  },
  {
    id: 'cymatics',
    labelKey: 'visualizerModeLabelBatch36.cymatics',
    modes: CYMATICS_MODES,
  },
] as const satisfies readonly {
  id: string;
  labelKey: ParseKeys<'web'>;
  modes: readonly VisualizerMode[];
}[];

export function VisualizerModeMenu({
  mode,
  onModeChange,
  triggerClassName,
  panelClassName,
}: Props) {
  const { t } = useTranslation('web');
  const currentLabel = isAmbientScene(mode)
    ? t(AMBIENT_LABEL_KEYS[mode])
    : visualizerModeLabel(t, mode);
  return (
    <Popover
      anchor="bottom end"
      panelClassName={panelClassName}
      tooltip={{
        content: t('visualizerModeMenuText.visualizer'),
        side: 'left',
      }}
      trigger={
        <Button
          size="icon"
          variant="text"
          aria-label={t('visualizerModeMenuBatch36.current', {
            mode: currentLabel,
          })}
          aria-haspopup="menu"
          data-testid="visualizer-mode-trigger"
          className={triggerClassName}
        >
          <AudioWaveformIcon size={22} aria-hidden />
        </Button>
      }
    >
      <Popover.Menu
        role="menu"
        aria-label={t('visualizerModeMenuText.visualizer')}
        data-testid="visualizer-mode-menu"
        className="max-h-[min(32rem,70dvh)] w-80 max-w-[calc(100vw-3rem)] gap-3 overflow-y-auto"
      >
        <Popover.Section
          label={t('visualizerModeMenu.ambience')}
          role="group"
          aria-label={t('visualizerModeMenu.ambience')}
        >
          <div className="grid grid-cols-2 gap-2 p-1">
            {AMBIENT_SCENES.map((id) => {
              const selected = id === mode;
              const label = t(AMBIENT_LABEL_KEYS[id]);
              return (
                <Button
                  key={id}
                  type="button"
                  variant="plain"
                  size="flexible"
                  title={label}
                  role="menuitemradio"
                  aria-checked={selected}
                  data-testid={`visualizer-scene-${id}`}
                  onClick={() => onModeChange(id)}
                  className={`relative flex flex-col items-stretch gap-1 rounded-lg border-2 p-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${selected ? 'border-current' : 'border-transparent hover:border-current/50'}`}
                >
                  <AmbientScenePreview scene={id} />
                  <span className="px-0.5 text-xs font-medium">{label}</span>
                  {selected && (
                    <span className="bg-background text-foreground absolute top-2 right-2 rounded-full p-1">
                      <CheckIcon size={14} aria-hidden />
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </Popover.Section>
        {GROUPS.map((group) => (
          <Popover.Section
            key={group.id}
            label={t(group.labelKey)}
            role="group"
            aria-label={t(group.labelKey)}
          >
            <div className="grid grid-cols-2 gap-2 p-1">
              {group.modes.map((id) => {
                const selected = id === mode;
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="plain"
                    size="flexible"
                    title={visualizerModeLabel(t, id)}
                    aria-label={visualizerModeLabel(t, id)}
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => onModeChange(id)}
                    className={`relative block rounded-lg border-2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${selected ? 'border-current' : 'border-transparent hover:border-current/50'}`}
                  >
                    <VisualizerModePreview mode={id} />
                    <span className="sr-only">
                      {visualizerModeLabel(t, id)}
                    </span>
                    {selected && (
                      <span className="bg-background text-foreground absolute top-2 right-2 rounded-full p-1">
                        <CheckIcon size={14} aria-hidden />
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </Popover.Section>
        ))}
      </Popover.Menu>
    </Popover>
  );
}
