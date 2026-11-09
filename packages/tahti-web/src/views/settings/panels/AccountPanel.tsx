import { Link } from '@tanstack/react-router';
import {
  AtSign,
  Bell,
  CreditCardIcon,
  Database,
  Download,
  Keyboard,
  KeyRound,
  Landmark,
  Lock,
  LogInIcon,
  LogOutIcon,
  MonitorSmartphone,
  Shield,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonAnchor,
  ButtonLink,
  InlineLoader,
  Meter,
  Tabs,
  Textarea,
  toast,
  type TabsItem,
} from '@tahti-player/ui';

import {
  cancelMySubscription,
  fetchMembership,
  fetchMyPurchases,
  fetchMySubscriptions,
  requestAccountDeletion,
} from '../../../api/client';
import {
  fetchStorageUsage,
  type StorageUsage,
} from '../../../api/studio-extras';
import type {
  FanSubscriptionRow,
  MembershipStatus,
  PurchaseRow,
} from '../../../api/types';
import { ApiTokensPanel } from '../../../components/ApiTokensPanel';
import { BlockedAccounts } from '../../../components/BlockedAccounts';
import { ChangeEmailForm } from '../../../components/ChangeEmailForm';
import { ChangePasswordForm } from '../../../components/ChangePasswordForm';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DevicesSessionsPanel } from '../../../components/DevicesSessionsPanel';
import { FanSubscriptionsBillingButton } from '../../../components/FanSubscriptionsBillingButton';
import { ListingDate } from '../../../components/ListingDate';
import { MembershipInvoices } from '../../../components/MembershipInvoices';
import { MembershipStatusPanel } from '../../../components/MembershipStatusPanel';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { RestrictionNotices } from '../../../components/RestrictionNotice';
import { SecurityTotpPanel } from '../../../components/SecurityTotpPanel';
import {
  fanSubscriptionStatusLabel,
  hasPortalManagedSubscription,
  isCanceledAtPeriodEnd,
} from '../../../lib/fanSubscriptionStatus';
import { useAuthModalStore } from '../../../stores/authModalStore';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint, SettingsInfo } from '../SettingsFields';
import { accountTabLanding, groupAccountTabs } from './accountTabGroups';
import { MentionsPanel } from './MentionsPanel';
import { NotificationsVisibilityPanel } from './NotificationsPanel';

const GovernanceView = lazy(() =>
  import('../../GovernanceView').then((module) => ({
    default: module.GovernanceView,
  })),
);

function euros(cents: number | string): string {
  const n = typeof cents === 'string' ? Number(cents) : cents;
  if (!Number.isFinite(n)) {
    return '—';
  }
  return `€${(n / 100).toFixed(n % 100 === 0 ? 0 : 2)}`;
}

export function AccountPanel() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const closeSettings = useSettingsModalStore((s) => s.close);
  const accountSection = useSettingsModalStore((s) => s.accountSection);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [membershipAttempt, setMembershipAttempt] = useState(0);
  const [subscriptions, setSubscriptions] = useState<FanSubscriptionRow[]>([]);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(
    null,
  );
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<FanSubscriptionRow | null>(
    null,
  );
  const [cancelBusy, setCancelBusy] = useState(false);

  const reloadSubscriptions = () =>
    fetchMySubscriptions().then((r) => {
      setSubscriptions(r.data);
      setSubscriptionsError(
        r.meta.source === 'api' ? (r.meta.reason ?? null) : null,
      );
    });

  const reloadPurchases = () =>
    fetchMyPurchases().then((r) => {
      setPurchases(r.data);
      setPurchasesError(
        r.meta.source === 'api' ? (r.meta.reason ?? null) : null,
      );
    });

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

  useEffect(() => {
    void reloadSubscriptions();
    void reloadPurchases();
  }, []);

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
          <SettingsInfo
            label={t('settingsBody.account.signedInAs')}
            value={`@${user.username}`}
          />
          <SettingsInfo
            label={t('settingsBody.account.displayName')}
            value={user.displayName}
          />
          {user.email && (
            <SettingsInfo
              label={t('settingsBody.account.email')}
              value={user.email}
            />
          )}
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
      id: 'password-email',
      label: t('settingsBody.account.tabPasswordEmail'),
      icon: <KeyRound size={14} />,
      content: (
        <div className="flex flex-col gap-8">
          <ChangePasswordForm />
          <ChangeEmailForm currentEmail={user.email ?? null} />
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
    {
      id: 'membership',
      label: t('settingsBody.account.tabMembership'),
      icon: <Wallet size={14} />,
      content:
        !membership && membershipError ? (
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
          <div className="flex flex-col gap-6">
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
          </div>
        ),
    },
    {
      id: 'governance',
      label: t('settingsBody.account.tabGovernance'),
      icon: <Landmark size={14} />,
      content: (
        <Suspense
          fallback={
            <PageLoading label={t('settingsBody.account.loadingGovernance')} />
          }
        >
          <GovernanceView embedded />
        </Suspense>
      ),
    },
    {
      id: 'storage',
      label: t('settingsBody.account.tabStorage'),
      icon: <Database size={14} />,
      content: <AccountStoragePanel />,
    },
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
    {
      id: 'subscriptions',
      label: t('settingsBody.account.tabSubscriptions'),
      icon: <Wallet size={14} />,
      content: (
        <div className="flex flex-col gap-4">
          {subscriptionsError && subscriptions.length === 0 ? (
            <PageError
              title={t('settingsBody.account.subscriptionsLoadError')}
              description={subscriptionsError}
              onRetry={() => void reloadSubscriptions()}
            />
          ) : subscriptions.length === 0 ? (
            <PageEmpty title={t('settingsBody.account.subscriptionsEmpty')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {subscriptions.map((subscription) => (
                <li
                  key={subscription.id}
                  className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <Link
                      to="/u/$username"
                      params={{ username: subscription.artist.username }}
                      onClick={closeSettings}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {subscription.artist.displayName}
                    </Link>
                    <p className="text-foreground-secondary text-xs">
                      {subscription.tierName}, {euros(subscription.amountCents)}
                      /mo, {fanSubscriptionStatusLabel(subscription)}
                    </p>
                  </div>
                  {isCanceledAtPeriodEnd(subscription) ? null : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingCancel(subscription)}
                    >
                      {t('settingsBody.account.manage')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {hasPortalManagedSubscription(subscriptions) ? (
            <FanSubscriptionsBillingButton />
          ) : null}
          <ConfirmDialog
            destructive
            isOpen={pendingCancel !== null}
            title={
              pendingCancel
                ? t('settingsBody.account.cancelSubscriptionNamed', {
                    tier: pendingCancel.tierName,
                    artist: pendingCancel.artist.displayName,
                  })
                : t('settingsBody.account.cancelSubscriptionTitle')
            }
            description={t(
              'settingsBody.account.cancelSubscriptionDescription',
            )}
            confirmLabel={
              cancelBusy
                ? t('settingsBody.account.cancelSubscriptionBusy')
                : t('settingsBody.account.cancelSubscriptionConfirm')
            }
            cancelLabel={t('settingsBody.account.keepSubscription')}
            onCancel={() => setPendingCancel(null)}
            onConfirm={() => {
              const target = pendingCancel;
              if (!target || cancelBusy) {
                return;
              }
              setCancelBusy(true);
              void cancelMySubscription(target.id).then((r) => {
                setCancelBusy(false);
                setPendingCancel(null);
                if (r.ok) {
                  void reloadSubscriptions();
                } else {
                  toast.error(r.error);
                }
              });
            }}
          />
        </div>
      ),
    },
    {
      id: 'purchases',
      label: t('settingsBody.account.tabPurchases'),
      icon: <CreditCardIcon size={14} />,
      content:
        purchasesError && purchases.length === 0 ? (
          <PageError
            title={t('settingsBody.account.purchasesLoadError')}
            description={purchasesError}
            onRetry={() => void reloadPurchases()}
          />
        ) : purchases.length === 0 ? (
          <PageEmpty title={t('settingsBody.account.purchasesEmpty')} />
        ) : (
          <ul className="flex flex-col gap-2">
            {purchases.map((purchase) => (
              <li
                key={purchase.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {purchase.tracks.map((t) => t.title).join(', ') ||
                      purchase.tierName}
                  </p>
                  <p className="text-foreground-secondary text-xs">
                    <Link
                      to="/u/$username"
                      params={{ username: purchase.artist.username }}
                      onClick={closeSettings}
                      className="underline-offset-2 hover:underline"
                    >
                      {purchase.artist.displayName}
                    </Link>
                    {' · '}
                    {euros(purchase.amountCents)}
                    {' · '}
                    <ListingDate value={purchase.createdAt} />
                  </p>
                </div>
                {purchase.tracks[0] ? (
                  <ButtonLink
                    to="/t/$id"
                    params={{ id: purchase.tracks[0].id }}
                    onClick={closeSettings}
                    variant="ghost"
                    size="sm"
                  >
                    {t('accountPanelText.listen')}
                  </ButtonLink>
                ) : null}
              </li>
            ))}
          </ul>
        ),
    },
    {
      id: 'privacy',
      label: t('settingsBody.account.tabPrivacy'),
      icon: <Shield size={14} />,
      content: <PrivacyDataPanel username={user.username} />,
    },
  ];

  const landing = accountTabLanding(accountSection);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <RestrictionNotices />
      <Tabs
        key={accountSection ?? 'session'}
        className="min-w-0"
        listClassName="flex-wrap"
        defaultIndex={landing.group}
        items={groupAccountTabs(tabItems).map(({ group, tabs }, index) => ({
          id: group.id,
          label: group.labelKey
            ? t(group.labelKey as 'settings.accountTabGroupSignInSecurity')
            : (group.label ?? group.id),
          icon: <group.Icon size={14} />,
          content: (
            <Tabs
              className="min-w-0"
              listClassName="border-border flex-wrap gap-1 border-b pb-2"
              panelClassName="pt-3"
              defaultIndex={index === landing.group ? landing.tab : 0}
              items={tabs}
            />
          ),
        }))}
      />
    </div>
  );
}

function formatStorageBytes(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes)) {
    return '—';
  }
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }
  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

function AccountStoragePanel() {
  const { t } = useTranslation('web');
  const [storage, setStorage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    void fetchStorageUsage().then((result) => setStorage(result.data));
  }, []);

  if (!storage) {
    return <InlineLoader label={t('settingsBody.account.loadingStorage')} />;
  }

  const usedPercent = storage.quotaBytes
    ? Math.min(100, (storage.usedBytes / storage.quotaBytes) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary-strong flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Database size={19} aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">
            {t('settingsBody.account.yourStorage')}
          </h2>
          <p className="text-foreground-secondary mt-1 text-sm">
            {t('settingsBody.account.storageDescription')}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsInfo
          label={t('settingsBody.account.used')}
          value={formatStorageBytes(storage.usedBytes)}
        />
        <SettingsInfo
          label={t('settingsBody.account.quota')}
          value={
            storage.unlimited
              ? t('settingsBody.account.unlimited')
              : formatStorageBytes(storage.quotaBytes)
          }
        />
      </div>
      {!storage.unlimited && storage.quotaBytes ? (
        <div className="flex flex-col gap-2">
          <Meter
            value={usedPercent}
            className="h-2"
            barClassName="transition-[width]"
            aria-label={t('settingsBody.account.storageUsedAria')}
          />
          <p className="text-foreground-secondary text-xs">
            {t('settingsBody.account.storagePercentUsed', {
              percent: Math.round(usedPercent),
            })}
          </p>
        </div>
      ) : null}
      <SettingsHint>
        {t('settingsBody.account.storageMembershipHint')}
      </SettingsHint>
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
