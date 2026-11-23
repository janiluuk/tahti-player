import { Link } from '@tanstack/react-router';
import {
  CreditCardIcon,
  Database,
  Download,
  Keyboard,
  Landmark,
  LogInIcon,
  LogOutIcon,
  Shield,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonAnchor,
  ButtonLink,
  MediaArtwork,
  Tabs,
  Textarea,
  type TabsItem,
} from '@tahti-player/ui';

import { fetchMembership, requestAccountDeletion } from '../../../api/client';
import type { MembershipStatus } from '../../../api/types';
import { BlockedAccounts } from '../../../components/BlockedAccounts';
import { MembershipInvoices } from '../../../components/MembershipInvoices';
import { MembershipStatusPanel } from '../../../components/MembershipStatusPanel';
import { PageError, PageLoading } from '../../../components/PageStates';
import { RestrictionNotices } from '../../../components/RestrictionNotice';
import { useAuthModalStore } from '../../../stores/authModalStore';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint } from '../SettingsFields';
import { AccountBillingPanel } from './AccountBillingPanel';
import { AccountStoragePanel } from './AccountStoragePanel';
import { ACCOUNT_TAB_IDS, accountTabIndex } from './accountTabGroups';

export function AccountPanel() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const closeSettings = useSettingsModalStore((s) => s.close);
  const accountSection = useSettingsModalStore((s) => s.accountSection);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [membershipAttempt, setMembershipAttempt] = useState(0);
  useEffect(() => {
    if (!user) {
      return;
    }
    void fetchMembership().then((r) => {
      setMembership(r.data);
      setMembershipError(
        r.data
          ? null
          : (r.meta.reason ?? t('settingsBody.account.membershipUnavailable')),
      );
    });
  }, [user, membershipAttempt]);

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <SettingsHint>{t('settingsBody.account.signInPrompt')}</SettingsHint>
        <Button
          size="sm"
          onClick={() => useAuthModalStore.getState().open('login')}
        >
          <LogInIcon size={15} aria-hidden className="mr-1.5" />
          {t('settings.logIn')}
        </Button>
      </div>
    );
  }

  const tabItems: TabsItem[] = [
    {
      id: 'session',
      label: t('settingsBody.account.tabSession'),
      icon: <User size={14} />,
      content: (
        <div className="flex flex-col gap-6">
          <div
            data-testid="account-profile-card"
            className="border-border bg-background-secondary/35 flex items-center gap-4 rounded-lg border p-4"
          >
            <MediaArtwork
              src={user.avatarUrl ?? undefined}
              alt=""
              seed={user.username}
              size="thumb"
              className="size-14 shrink-0 rounded-full"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg font-bold">
                {user.displayName || user.username}
              </span>
              <span className="text-foreground-secondary truncate text-sm">
                {t('settingsBody.account.signedInAs')} @{user.username}
              </span>
              {user.email ? (
                <span className="text-foreground-secondary truncate text-sm">
                  {user.email}
                </span>
              ) : null}
            </div>
          </div>
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
      ),
    },
    {
      id: 'membership',
      label: t('settingsBody.account.tabMembership'),
      icon: <Wallet size={14} />,
      content: (
        <div className="flex flex-col gap-6">
          {!membership && membershipError ? (
            <PageError
              title={t('settingsBody.account.membershipLoadError')}
              description={membershipError}
              onRetry={() => {
                setMembershipError(null);
                setMembershipAttempt((n) => n + 1);
              }}
            />
          ) : !membership ? (
            <PageLoading label={t('settingsBody.account.membershipLoading')} />
          ) : (
            <>
              <MembershipStatusPanel
                membership={membership}
                userEmail={user.email}
                onChange={() => {
                  void fetchMembership().then((r) => setMembership(r.data));
                }}
              />
              <MembershipInvoices />
              <SettingsHint>
                {t('settingsBody.account.membershipRenewalHint')}
              </SettingsHint>
            </>
          )}
          <div className="flex flex-col items-start gap-3">
            <SettingsHint>
              {t('settingsBody.account.governanceMoved')}
            </SettingsHint>
            <ButtonLink
              to="/governance"
              onClick={closeSettings}
              size="sm"
              variant="secondary"
              data-testid="account-open-coop"
            >
              <Landmark size={15} aria-hidden className="mr-1.5" />
              {t('settingsBody.account.openCoop')}
            </ButtonLink>
          </div>
        </div>
      ),
    },
    {
      id: 'storage',
      label: t('settingsBody.account.tabStorage'),
      icon: <Database size={14} />,
      content: <AccountStoragePanel />,
    },
    {
      id: 'subscriptions',
      label: t('settingsBody.account.tabSubsPurchases'),
      icon: <CreditCardIcon size={14} />,
      content: <AccountBillingPanel />,
    },
    {
      id: 'privacy',
      label: t('settingsBody.account.tabPrivacy'),
      icon: <Shield size={14} />,
      content: <PrivacyDataPanel username={user.username} />,
    },
  ];

  const orderedTabs = ACCOUNT_TAB_IDS.flatMap((id) =>
    tabItems.filter((item) => item.id === id),
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <RestrictionNotices />
      <Tabs
        key={accountSection ?? 'session'}
        className="min-w-0"
        listClassName="border-border flex-wrap gap-1 border-b pb-2"
        panelClassName="pt-3"
        defaultIndex={accountTabIndex(accountSection)}
        items={orderedTabs}
      />
    </div>
  );
}

function PrivacyDataPanel({ username }: { username: string }) {
  const { t } = useTranslation('web');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submitDeletionRequest = () => {
    if (!reason.trim()) {
      return;
    }
    setPending(true);
    setMessage(null);
    void requestAccountDeletion(reason.trim()).then((result) => {
      setPending(false);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setReason('');
      setMessage(
        t('settingsBody.account.deletionSubmitted', {
          ticketId: result.ticketId,
        }),
      );
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-semibold">{t('settingsBody.account.yourData')}</h2>
        <p className="text-foreground-secondary mt-1 text-sm">
          {t('settingsBody.account.yourDataDescription')}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ButtonAnchor
          href="/tahti-api/api/me/data-export.json"
          download="tahti-data-export.json"
          variant="text"
          size="flexible"
          className="border-border hover:border-primary flex items-center justify-start gap-3 rounded-lg border p-3 text-left font-normal whitespace-normal transition-colors active:scale-100"
        >
          <Download size={17} aria-hidden />
          <span>
            <span className="block text-sm font-semibold">
              {t('settingsBody.account.dataExport')}
            </span>
            <span className="text-foreground-secondary block text-xs">
              {t('settingsBody.account.dataExportDescription')}
            </span>
          </span>
        </ButtonAnchor>
        <ButtonAnchor
          href="/tahti-api/api/me/press-kit.json"
          variant="text"
          size="flexible"
          className="border-border hover:border-primary flex items-center justify-start gap-3 rounded-lg border p-3 text-left font-normal whitespace-normal transition-colors active:scale-100"
        >
          <Download size={17} aria-hidden />
          <span>
            <span className="block text-sm font-semibold">
              {t('settingsBody.account.pressKit')}
            </span>
            <span className="text-foreground-secondary block text-xs">
              {t('settingsBody.account.pressKitDescription')}
            </span>
          </span>
        </ButtonAnchor>
      </div>
      <BlockedAccounts />
      <div className="border-accent-red/40 bg-accent-red/5 flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Trash2 size={17} className="text-accent-red-strong" aria-hidden />
          <h2 className="font-semibold">
            {t('settingsBody.account.requestDeletion')}
          </h2>
        </div>
        <p className="text-foreground-secondary text-sm">
          {t('settingsBody.account.requestDeletionDescription')}
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitDeletionRequest();
          }}
        >
          <Textarea
            value={reason}
            rows={3}
            maxLength={2000}
            placeholder={t('settingsBody.account.deletionReasonPlaceholder')}
            aria-label={t('settingsBody.account.deletionReasonAria')}
            onChange={(event) => setReason(event.target.value)}
            submitOnModEnter
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              type="submit"
              variant="secondary"
              className="text-accent-red-strong"
              disabled={pending || !reason.trim()}
            >
              <Trash2 size={15} aria-hidden className="mr-1.5" />
              {pending
                ? t('settingsBody.account.submitting')
                : t('settingsBody.account.submitRequest')}
            </Button>
            {message ? (
              <p className="text-foreground-secondary text-xs" role="status">
                {message}
              </p>
            ) : null}
          </div>
        </form>
      </div>
      <Link
        to="/privacy"
        className="text-foreground-secondary text-xs hover:underline"
      >
        {t('settingsBody.account.readPrivacyPolicy', { username })}
      </Link>
    </div>
  );
}
