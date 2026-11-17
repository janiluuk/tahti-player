import { AtSign, Bell } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Tabs } from '@tahti-player/ui';

import {
  useSettingsModalStore,
  type NotificationsSettingsSection,
} from '../../../stores/settingsModalStore';
import { MentionsPanel } from './MentionsPanel';
import { NotificationsVisibilityPanel } from './NotificationsPanel';

const SECTIONS: readonly NotificationsSettingsSection[] = [
  'notifications',
  'mentions',
];

export function SettingsNotificationsPanel() {
  const { t } = useTranslation('web');
  const notificationsSection = useSettingsModalStore(
    (s) => s.notificationsSection,
  );
  const selectedIndex = Math.max(
    0,
    SECTIONS.indexOf(notificationsSection ?? 'notifications'),
  );

  return (
    <Tabs
      selectedIndex={selectedIndex}
      onChange={(index) =>
        useSettingsModalStore.setState({
          notificationsSection: SECTIONS[index] ?? 'notifications',
        })
      }
      listClassName="flex-wrap"
      items={[
        {
          id: 'notifications',
          label: t('settingsBody.account.tabNotifications'),
          icon: <Bell size={14} />,
          content: <NotificationsVisibilityPanel />,
        },
        {
          id: 'mentions',
          label: t('settingsBody.account.tabMentions'),
          icon: <AtSign size={14} />,
          content: <MentionsPanel />,
        },
      ]}
    />
  );
}
