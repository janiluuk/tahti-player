import { KeyRound, Lock, MonitorSmartphone } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Tabs } from '@tahti-player/ui';

import { ApiTokensPanel } from '../../../components/ApiTokensPanel';
import { ChangeEmailForm } from '../../../components/ChangeEmailForm';
import { ChangePasswordForm } from '../../../components/ChangePasswordForm';
import { DevicesSessionsPanel } from '../../../components/DevicesSessionsPanel';
import { SecurityTotpPanel } from '../../../components/SecurityTotpPanel';
import { useAuthStore } from '../../../stores/authStore';
import {
  useSettingsModalStore,
  type SecuritySettingsSection,
} from '../../../stores/settingsModalStore';

const SECTIONS: readonly SecuritySettingsSection[] = [
  'password-email',
  'devices',
  'two-factor',
  'api-tokens',
];

export function SecurityPanel() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const securitySection = useSettingsModalStore((s) => s.securitySection);
  const selectedIndex = Math.max(
    0,
    SECTIONS.indexOf(securitySection ?? 'password-email'),
  );

  return (
    <Tabs
      selectedIndex={selectedIndex}
      onChange={(index) =>
        useSettingsModalStore.setState({
          securitySection: SECTIONS[index] ?? 'password-email',
        })
      }
      listClassName="flex-wrap"
      items={[
        {
          id: 'password-email',
          label: t('settingsBody.account.tabPasswordEmail'),
          icon: <KeyRound size={14} />,
          content: (
            <div className="flex flex-col gap-8">
              <ChangePasswordForm />
              <ChangeEmailForm currentEmail={user?.email ?? null} />
            </div>
          ),
        },
        {
          id: 'devices',
          label: t('settingsBody.account.tabDevices'),
          icon: <MonitorSmartphone size={14} />,
          content: <DevicesSessionsPanel />,
        },
        {
          id: 'two-factor',
          label: t('settingsBody.account.tabTwoFactor'),
          icon: <Lock size={14} />,
          content: <SecurityTotpPanel />,
        },
        {
          id: 'api-tokens',
          label: t('settingsBody.account.tabApiTokens'),
          icon: <KeyRound size={14} />,
          content: <ApiTokensPanel />,
        },
      ]}
    />
  );
}
