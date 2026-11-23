import {
  KeyRound,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  ShieldHalf,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, Button, Dialog, EditIconButton, Tabs } from '@tahti-player/ui';

import { accountHasPassword } from '../../../api/account-credentials';
import { ApiTokensPanel } from '../../../components/ApiTokensPanel';
import { ChangeEmailForm } from '../../../components/ChangeEmailForm';
import { ChangePasswordForm } from '../../../components/ChangePasswordForm';
import { DevicesSessionsPanel } from '../../../components/DevicesSessionsPanel';
import { LinkedLoginsSection } from '../../../components/LinkedLoginsSection';
import { SecurityTotpPanel } from '../../../components/SecurityTotpPanel';
import { SetPasswordForm } from '../../../components/SetPasswordForm';
import { useAuthStore } from '../../../stores/authStore';
import {
  useSettingsModalStore,
  type SecuritySettingsSection,
} from '../../../stores/settingsModalStore';

type TabId = 'overview' | 'devices' | 'api-tokens';

const TABS: readonly TabId[] = ['overview', 'devices', 'api-tokens'];

function tabForSection(section: SecuritySettingsSection | null): TabId {
  if (section === 'devices' || section === 'api-tokens') {
    return section;
  }
  return 'overview';
}

function SignInRow({
  icon,
  label,
  value,
  note,
  action,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  note: string;
  action: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        aria-hidden
        className="bg-background-secondary text-foreground flex size-9 shrink-0 items-center justify-center rounded-full"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{label}</span>
        {value ? <span className="truncate text-sm">{value}</span> : null}
        <span className="text-foreground-secondary text-xs">{note}</span>
      </div>
      {action}
    </li>
  );
}

function SecurityOverview() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const hasPassword = accountHasPassword(user);
  const email = user?.email ?? null;
  const signInHeadingId = useId();
  const [dialog, setDialog] = useState<'password' | 'email' | null>(null);
  const [twoFactorOn, setTwoFactorOn] = useState<boolean | null>(null);
  const twoFactorRef = useRef<HTMLDivElement>(null);
  const focusTwoFactor = useSettingsModalStore(
    (s) => s.securitySection === 'two-factor',
  );

  const showTwoFactor = () => {
    twoFactorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    if (focusTwoFactor) {
      showTwoFactor();
    }
  }, [focusTwoFactor]);

  const passwordLabel = hasPassword
    ? t('settingsBody.account.changePassword')
    : t('settingsBody.account.setPasswordAction');

  return (
    <div className="flex flex-col gap-8">
      {twoFactorOn === false ? (
        <Alert
          tone="info"
          data-testid="security-2fa-banner"
          icon={<ShieldHalf size={18} aria-hidden />}
          title={t('settingsBody.account.twoFactorBannerTitle')}
        >
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm">
              {t('settingsBody.account.twoFactorBannerBody')}
            </p>
            <Button size="sm" className="gap-1.5" onClick={showTwoFactor}>
              <ShieldCheck size={14} aria-hidden />
              {t('settingsBody.account.twoFactorBannerAction')}
            </Button>
          </div>
        </Alert>
      ) : null}

      <section
        aria-labelledby={signInHeadingId}
        className="flex flex-col gap-3"
      >
        <h3 id={signInHeadingId} className="font-semibold">
          {t('settingsBody.account.signInSection')}
        </h3>
        <ul className="border-border divide-border divide-y rounded-lg border">
          <SignInRow
            icon={<KeyRound size={16} />}
            label={t('settingsBody.account.password')}
            value={hasPassword ? '••••••••••' : undefined}
            note={
              hasPassword
                ? t('settingsBody.account.passwordRowNote')
                : t('settingsBody.account.noPasswordRowNote')
            }
            action={
              <EditIconButton
                label={passwordLabel}
                data-testid="security-edit-password"
                onClick={() => setDialog('password')}
              />
            }
          />
          <SignInRow
            icon={<Mail size={16} />}
            label={t('settingsBody.account.email')}
            value={email ?? t('settingsBody.account.emailRowMissing')}
            note={t('settingsBody.account.emailRowNote')}
            action={
              <EditIconButton
                label={t('settingsBody.account.changeEmail')}
                data-testid="security-edit-email"
                onClick={() => setDialog('email')}
              />
            }
          />
        </ul>
      </section>

      <div ref={twoFactorRef} className="scroll-mt-4">
        <SecurityTotpPanel onStatusChange={setTwoFactorOn} />
      </div>

      <LinkedLoginsSection />

      <Dialog
        isOpen={dialog === 'password'}
        onClose={() => setDialog(null)}
        title={passwordLabel}
      >
        {hasPassword ? (
          <ChangePasswordForm embedded />
        ) : (
          <SetPasswordForm embedded />
        )}
      </Dialog>
      <Dialog
        isOpen={dialog === 'email'}
        onClose={() => setDialog(null)}
        title={t('settingsBody.account.changeEmail')}
      >
        <ChangeEmailForm embedded currentEmail={email} />
      </Dialog>
    </div>
  );
}

export function SecurityPanel() {
  const { t } = useTranslation('web');
  const securitySection = useSettingsModalStore((s) => s.securitySection);
  const selectedIndex = TABS.indexOf(tabForSection(securitySection));

  return (
    <Tabs
      selectedIndex={selectedIndex}
      onChange={(index) =>
        useSettingsModalStore.setState({
          securitySection:
            TABS[index] === 'overview'
              ? 'password-email'
              : (TABS[index] ?? 'password-email'),
        })
      }
      listClassName="flex-wrap"
      items={[
        {
          id: 'overview',
          label: t('settingsBody.account.tabSecurityOverview'),
          icon: <ShieldCheck size={14} />,
          content: <SecurityOverview />,
        },
        {
          id: 'devices',
          label: t('settingsBody.account.tabDevices'),
          icon: <MonitorSmartphone size={14} />,
          content: <DevicesSessionsPanel />,
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
