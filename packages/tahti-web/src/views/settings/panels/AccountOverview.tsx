import {
  Database,
  Keyboard,
  Languages,
  LogOutIcon,
  Mail,
  MonitorSmartphone,
  PencilIcon,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ButtonLink, MediaArtwork } from '@tahti-player/ui';

import { fetchTotpStatus } from '../../../api/security';
import { browserLocale, WEB_LOCALES } from '../../../lib/locale';
import { useAuthStore } from '../../../stores/authStore';
import { useLanguageStore } from '../../../stores/languageStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsRow } from '../SettingsFields';

function useTwoFactorEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void fetchTotpStatus()
      .then((result) => {
        if (active) {
          setEnabled(result.data.enabled);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return enabled;
}

function useLanguageName(): string {
  const { t } = useTranslation('web');
  const choice = useLanguageStore((s) => s.choice);
  if (choice === 'auto') {
    const browser = WEB_LOCALES.find((item) => item.code === browserLocale());
    return t('language.auto', { language: browser?.nativeLabel ?? '' });
  }
  return (
    WEB_LOCALES.find((item) => item.code === choice)?.nativeLabel ?? choice
  );
}

export function AccountOverview() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const open = useSettingsModalStore((s) => s.open);
  const closeSettings = useSettingsModalStore((s) => s.close);
  const twoFactorOn = useTwoFactorEnabled();
  const languageName = useLanguageName();

  if (!user) {
    return null;
  }
  const hasChannel = Boolean(user.channel);

  const manage = (label: string, onClick: () => void, testId: string) => (
    <Button
      size="sm"
      variant="secondary"
      aria-label={t('settingsBody.account.manageNamed', { name: label })}
      data-testid={testId}
      onClick={onClick}
    >
      {t('settingsBody.account.manage')}
    </Button>
  );

  const securityLabel = t('settingsBody.account.signInAndSecurity');
  const devicesLabel = t('settingsBody.account.tabDevices');
  const languageLabel = t('language.label');
  const dataLabel = t('settingsBody.account.yourData');
  const emailLabel = t('settingsBody.account.email');

  return (
    <div className="flex flex-col gap-6">
      <div
        data-testid="account-profile-card"
        className="border-border bg-background-secondary/35 flex flex-wrap items-center gap-4 rounded-lg border p-4"
      >
        <MediaArtwork
          src={user.avatarUrl ?? undefined}
          alt=""
          seed={user.username}
          size="thumb"
          className="size-14 shrink-0 rounded-full"
        />
        <div className="flex min-w-40 flex-1 flex-col">
          <span className="truncate text-lg font-bold">
            {user.displayName || user.username}
          </span>
          <span className="text-foreground-secondary truncate text-sm">
            {t('settingsBody.account.signedInAs')} @{user.username}
          </span>
        </div>
        {hasChannel ? (
          <ButtonLink
            to="/studio/profile"
            onClick={closeSettings}
            size="sm"
            variant="secondary"
            data-testid="account-edit-artist-profile"
          >
            <PencilIcon size={15} aria-hidden className="mr-1.5" />
            {t('settingsBody.account.editArtistProfile')}
          </ButtonLink>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            data-testid="account-edit-profile"
            onClick={() => open('artist')}
          >
            <UserCircle2 size={15} aria-hidden className="mr-1.5" />
            {t('settingsBody.account.editProfile')}
          </Button>
        )}
      </div>

      <ul
        className="border-border divide-border divide-y rounded-lg border"
        aria-label={t('settingsBody.account.accountSettings')}
      >
        <SettingsRow
          icon={<Mail size={16} />}
          label={emailLabel}
          value={user.email ?? t('settingsBody.account.emailRowMissing')}
          action={manage(
            emailLabel,
            () =>
              open(
                'security',
                undefined,
                undefined,
                undefined,
                undefined,
                'password-email',
              ),
            'account-manage-email',
          )}
        />
        <SettingsRow
          icon={<ShieldCheck size={16} />}
          label={securityLabel}
          value={
            twoFactorOn === null ? undefined : (
              <Badge
                variant="pill"
                color={twoFactorOn ? 'green' : 'secondary'}
                data-testid="account-2fa-status"
              >
                {twoFactorOn
                  ? t('settingsBody.account.twoFactorOnBadge')
                  : t('settingsBody.account.twoFactorOffBadge')}
              </Badge>
            )
          }
          note={t('settingsBody.account.signInAndSecurityNote')}
          action={manage(
            securityLabel,
            () =>
              open(
                'security',
                undefined,
                undefined,
                undefined,
                undefined,
                'two-factor',
              ),
            'account-manage-security',
          )}
        />
        <SettingsRow
          icon={<MonitorSmartphone size={16} />}
          label={devicesLabel}
          note={t('settingsBody.account.devicesRowNote')}
          action={manage(
            devicesLabel,
            () =>
              open(
                'security',
                undefined,
                undefined,
                undefined,
                undefined,
                'devices',
              ),
            'account-manage-devices',
          )}
        />
        <SettingsRow
          icon={<Languages size={16} />}
          label={languageLabel}
          value={languageName}
          action={manage(
            languageLabel,
            () => open('themes'),
            'account-manage-language',
          )}
        />
        <SettingsRow
          icon={<Database size={16} />}
          label={dataLabel}
          note={t('settingsBody.account.dataRowNote')}
          action={manage(
            dataLabel,
            () => open('account', undefined, undefined, 'privacy'),
            'account-manage-data',
          )}
        />
      </ul>

      <div className="flex flex-wrap gap-2">
        <ButtonLink
          to="/help/$slug"
          params={{ slug: 'keyboard-shortcuts' }}
          onClick={closeSettings}
          size="sm"
          variant="secondary"
        >
          <Keyboard size={15} aria-hidden className="mr-1.5" />
          {t('settingsBody.account.keyboardShortcuts')}
        </ButtonLink>
        <Button size="sm" variant="text" onClick={() => void logout()}>
          <LogOutIcon size={15} aria-hidden className="mr-1.5" />
          {t('nav.logOut')}
        </Button>
      </div>
    </div>
  );
}
