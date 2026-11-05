import { SettingsIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Popover, Toggle } from '@tahti-player/ui';

import {
  addItemType,
  setItemVisible,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../../lib/channelPageLayout';

type FeatureLabel =
  | 'avatar'
  | 'bio'
  | 'subscribe'
  | 'counts'
  | 'stage'
  | 'tracks'
  | 'feed'
  | 'shows'
  | 'links'
  | 'navigation'
  | 'programming';

type FeatureDef = { type: ChannelPageItemType; label: FeatureLabel };

type Feature = FeatureDef & { on: boolean };

/** Header features default on when a layout predates them; everything else
 * follows its layout entry. */
const DEFAULT_ON: ChannelPageItemType[] = ['avatar', 'about', 'headerStats'];

const HEADER_FEATURES: FeatureDef[] = [
  { type: 'avatar', label: 'avatar' },
  { type: 'about', label: 'bio' },
  { type: 'subscribe', label: 'subscribe' },
  { type: 'headerStats', label: 'counts' },
];

const PAGE_FEATURES: FeatureDef[] = [
  { type: 'hero', label: 'stage' },
  { type: 'sound', label: 'tracks' },
  { type: 'feed', label: 'feed' },
  { type: 'events', label: 'shows' },
  { type: 'links', label: 'links' },
  { type: 'navigation', label: 'navigation' },
];

/** The one place the channel designer turns page features on and off:
 * header details and page sections. Features that are off stay on the page
 * while editing, faded, so the artist sees where they would go. */
export function ChannelFeatureSettings({
  layout,
  updateLayout,
  isRadioChannel = false,
}: {
  layout: ChannelPageItem[];
  updateLayout: (
    updater: (prev: ChannelPageItem[]) => ChannelPageItem[],
  ) => void;
  isRadioChannel?: boolean;
}) {
  const { t } = useTranslation('web');
  const withState = (list: FeatureDef[]): Feature[] =>
    list.map(({ type, label }) => ({
      type,
      label,
      on:
        layout.find((item) => item.type === type)?.visible ??
        DEFAULT_ON.includes(type),
    }));
  const header = withState(
    isRadioChannel
      ? HEADER_FEATURES.filter((f) => f.type !== 'subscribe')
      : HEADER_FEATURES,
  );
  const page = withState(
    isRadioChannel
      ? [
          ...PAGE_FEATURES.filter((f) => f.type !== 'links'),
          { type: 'programming', label: 'programming' },
        ]
      : PAGE_FEATURES,
  );

  const toggle = (type: ChannelPageItemType, next: boolean) => {
    updateLayout((prev) => {
      const existing = prev.find((item) => item.type === type);
      if (next) {
        return addItemType(prev, type);
      }
      return existing ? setItemVisible(prev, existing.id, false) : prev;
    });
  };

  const group = (title: string, features: Feature[]) => (
    <section className="flex flex-col gap-2 px-3 py-2">
      <h3 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {features.map((feature) => (
        <div
          key={feature.type}
          className="flex items-center justify-between gap-4 text-sm"
          data-testid={`channel-feature-${feature.type}`}
        >
          <span>{t(`channelFeatures.${feature.label}`)}</span>
          <Toggle
            label={t(`channelFeatures.${feature.label}`)}
            checked={feature.on}
            onChange={(next) => toggle(feature.type, next)}
          />
        </div>
      ))}
    </section>
  );

  return (
    <Popover
      anchor="bottom end"
      panelClassName="w-72 px-0 py-1"
      trigger={
        <Button
          size="sm"
          variant="secondary"
          data-testid="channel-feature-settings"
        >
          <SettingsIcon size={14} aria-hidden />
          {t('channelFeatures.settings')}
        </Button>
      }
    >
      {group(t('channelFeatures.header'), header)}
      <div className="border-border border-t" />
      {group(t('channelFeatures.sections'), page)}
      <p className="text-foreground-secondary px-3 pt-1 pb-2 text-xs">
        {t('channelFeatures.hint')}
      </p>
    </Popover>
  );
}
