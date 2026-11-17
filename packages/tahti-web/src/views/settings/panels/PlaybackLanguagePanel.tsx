import { useTranslation } from '@tahti-player/i18n';
import { Tabs } from '@tahti-player/ui';

import {
  useSettingsModalStore,
  type PlaybackSettingsSection,
} from '../../../stores/settingsModalStore';
import { IntegrationsPanel } from './IntegrationsPanel';
import { LanguagePanel } from './LanguagePanel';
import { PlaybackPanel } from './PlaybackPanel';

const SECTIONS: readonly PlaybackSettingsSection[] = [
  'playback',
  'language',
  'integrations',
];

export function PlaybackLanguagePanel() {
  const { t } = useTranslation('web');
  const playbackSection = useSettingsModalStore((s) => s.playbackSection);
  const selectedIndex = Math.max(
    0,
    SECTIONS.indexOf(playbackSection ?? 'playback'),
  );

  return (
    <Tabs
      selectedIndex={selectedIndex}
      onChange={(index) =>
        useSettingsModalStore.setState({
          playbackSection: SECTIONS[index] ?? 'playback',
        })
      }
      listClassName="flex-wrap"
      items={[
        {
          id: 'playback',
          label: t('settings.playback'),
          content: <PlaybackPanel />,
        },
        {
          id: 'language',
          label: t('settings.language'),
          content: <LanguagePanel />,
        },
        {
          id: 'integrations',
          label: t('settings.integrations'),
          content: <IntegrationsPanel />,
        },
      ]}
    />
  );
}
