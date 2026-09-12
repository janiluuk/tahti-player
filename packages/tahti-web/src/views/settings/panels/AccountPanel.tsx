import { Link } from '@tanstack/react-router';
import {
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
  Shield,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

import { Button, Tabs, Textarea } from '@tahti-player/ui';

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
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { MembershipStatusPanel } from '../../../components/MembershipStatusPanel';
import { PageLoading } from '../../../components/PageStates';
import { SecurityTotpPanel } from '../../../components/SecurityTotpPanel';
import { useAuthModalStore } from '../../../stores/authModalStore';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint, SettingsInfo } from '../SettingsFields';
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
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [subscriptions, setSubscriptions] = useState<FanSubscriptionRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [pendingCancel, setPendingCancel] = useState<FanSubscriptionRow | null>(
    null,
  );
  const [cancelBusy, setCancelBusy] = useState(false);

  const reloadSubscriptions = () =>
    fetchMySubscriptions().then((r) => setSubscriptions(r.data));

  useEffect(() => {
    if (!user) {
      return;
    }
    void fetchMembership().then((r) => {
      setMembership(r.data);
    });
  }, [user]);

  useEffect(() => {
    void reloadSubscriptions();
    void fetchMyPurchases().then((r) => setPurchases(r.data));
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <SettingsHint>Sign in to manage membership and security.</SettingsHint>
        <Button
          size="sm"
          onClick={() => useAuthModalStore.getState().open('login')}
        >
          <LogInIcon size={15} aria-hidden className="mr-1.5" />
          Log in
        </Button>
      </div>
    );
  }

  return (
    <Tabs
      className="min-w-0"
      listClassName="flex-wrap"
      items={[
        {
          id: 'session',
          label: 'Session',
          icon: <User size={14} />,
          content: (
            <div className="flex flex-col gap-6">
              <SettingsInfo label="Signed in as" value={`@${user.username}`} />
              <SettingsInfo label="Display name" value={user.displayName} />
              {user.email && <SettingsInfo label="Email" value={user.email} />}
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/help/$slug"
                  params={{ slug: 'keyboard-shortcuts' }}
                  onClick={closeSettings}
                >
                  <Button size="sm" variant="secondary">
                    <Keyboard size={15} aria-hidden className="mr-1.5" />
                    Keyboard shortcuts
                  </Button>
                </Link>
                <Button size="sm" variant="text" onClick={() => void logout()}>
                  <LogOutIcon size={15} aria-hidden className="mr-1.5" />
                  Log out
                </Button>
              </div>
            </div>
          ),
        },
        {
          id: 'security',
          label: 'Security',
          icon: <Lock size={14} />,
          content: (
            <Tabs
              className="min-w-0"
              listClassName="border-border flex-wrap gap-1 border-b pb-2"
              panelClassName="pt-3"
              items={[
                {
                  id: 'two-factor',
                  label: 'Two-factor authentication',
                  icon: <Lock size={14} />,
                  content: <SecurityTotpPanel />,
                },
                {
                  id: 'api-tokens',
                  label: 'API tokens',
                  icon: <KeyRound size={14} />,
                  content: <ApiTokensPanel />,
                },
              ]}
            />
          ),
        },
        {
          id: 'membership',
          label: 'Membership',
          icon: <Wallet size={14} />,
          content: !membership ? (
            <SettingsHint>Could not load membership.</SettingsHint>
          ) : (
            <MembershipStatusPanel
              membership={membership}
              userEmail={user.email}
              onChange={() => {
                void fetchMembership().then((r) => setMembership(r.data));
              }}
            />
          ),
        },
        {
          id: 'governance',
          label: 'Governance',
          icon: <Landmark size={14} />,
          content: (
            <Suspense fallback={<PageLoading label="Loading governance…" />}>
              <GovernanceView />
            </Suspense>
          ),
        },
        {
          id: 'storage',
          label: 'Storage',
          icon: <Database size={14} />,
          content: <AccountStoragePanel />,
        },
        {
          id: 'notifications',
          label: 'Notifications & visibility',
          icon: <Bell size={14} />,
          content: <NotificationsVisibilityPanel />,
        },
        {
          id: 'subscriptions',
          label: 'Your subs',
          icon: <Wallet size={14} />,
          content: (
            <div className="flex flex-col gap-4">
              {subscriptions.length === 0 ? (
                <SettingsHint>
                  No fan subscriptions on this account.
                </SettingsHint>
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
                          {subscription.tierName},{' '}
                          {euros(subscription.amountCents)}/mo,{' '}
                          {subscription.canceledAt &&
                          subscription.currentPeriodEnd
                            ? `cancels ${new Date(
                                subscription.currentPeriodEnd,
                              ).toLocaleDateString()}`
                            : subscription.state}
                        </p>
                      </div>
                      {subscription.canceledAt ? null : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingCancel(subscription)}
                        >
                          Manage
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <ConfirmDialog
                isOpen={pendingCancel !== null}
                title={
                  pendingCancel
                    ? `Cancel your ${pendingCancel.tierName} subscription to ${pendingCancel.artist.displayName}?`
                    : 'Cancel subscription?'
                }
                description="You'll keep access until the end of the current billing period, then it won't renew."
                confirmLabel={
                  cancelBusy ? 'Cancelling…' : 'Cancel subscription'
                }
                cancelLabel="Keep subscription"
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
                    }
                  });
                }}
              />
            </div>
          ),
        },
        {
          id: 'purchases',
          label: 'Purchases',
          icon: <CreditCardIcon size={14} />,
          content:
            purchases.length === 0 ? (
              <SettingsHint>No track purchases on this account.</SettingsHint>
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
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {purchase.tracks[0] ? (
                      <Link
                        to="/t/$id"
                        params={{ id: purchase.tracks[0].id }}
                        onClick={closeSettings}
                      >
                        <Button variant="ghost" size="sm">
                          Listen
                        </Button>
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            ),
        },
        {
          id: 'privacy',
          label: 'Privacy & data',
          icon: <Shield size={14} />,
          content: <PrivacyDataPanel username={user.username} />,
        },
      ]}
    />
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
  const [storage, setStorage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    void fetchStorageUsage().then((result) => setStorage(result.data));
  }, []);

  if (!storage) {
    return <SettingsHint>Loading storage usage…</SettingsHint>;
  }

  const usedPercent = storage.quotaBytes
    ? Math.min(100, (storage.usedBytes / storage.quotaBytes) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Database size={19} aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Your storage</h2>
          <p className="text-foreground-secondary mt-1 text-sm">
            Audio, images, releases, and other files saved to your account.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsInfo
          label="Used"
          value={formatStorageBytes(storage.usedBytes)}
        />
        <SettingsInfo
          label="Quota"
          value={
            storage.unlimited
              ? 'Unlimited'
              : formatStorageBytes(storage.quotaBytes)
          }
        />
      </div>
      {!storage.unlimited && storage.quotaBytes ? (
        <div className="flex flex-col gap-2">
          <div className="bg-background-secondary h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width]"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="text-foreground-secondary text-xs">
            {Math.round(usedPercent)}% of your available storage is in use.
          </p>
        </div>
      ) : null}
      <SettingsHint>
        Membership accounts receive expanded storage according to the current
        Tahti storage policy.
      </SettingsHint>
    </div>
  );
}

function PrivacyDataPanel({ username }: { username: string }) {
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
        `Deletion request submitted (ticket ${result.ticketId}). The Tahti team will follow up by email.`,
      );
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-semibold">Your data</h2>
        <p className="text-foreground-secondary mt-1 text-sm">
          Download a copy of your account data or request deletion under GDPR.
          Deletion requests are reviewed manually.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="/tahti-api/api/me/data-export.json"
          className="border-border hover:border-primary flex items-center gap-3 rounded-lg border p-3 transition-colors"
        >
          <Download size={17} aria-hidden />
          <span>
            <span className="block text-sm font-semibold">Data export</span>
            <span className="text-foreground-secondary block text-xs">
              Full account JSON download
            </span>
          </span>
        </a>
        <a
          href="/tahti-api/api/me/press-kit.json"
          className="border-border hover:border-primary flex items-center gap-3 rounded-lg border p-3 transition-colors"
        >
          <Download size={17} aria-hidden />
          <span>
            <span className="block text-sm font-semibold">Press kit</span>
            <span className="text-foreground-secondary block text-xs">
              Your artist metadata as JSON
            </span>
          </span>
        </a>
      </div>
      <div className="border-accent-red/40 bg-accent-red/5 flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Trash2 size={17} className="text-accent-red" aria-hidden />
          <h2 className="font-semibold">Request account deletion</h2>
        </div>
        <p className="text-foreground-secondary text-sm">
          This starts a manual review. Your uploads and account data are removed
          according to the retention periods in the privacy policy.
        </p>
        <Textarea
          value={reason}
          rows={3}
          maxLength={2000}
          placeholder="Tell us briefly why you want to delete the account."
          aria-label="Reason for deletion request"
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            className="text-accent-red"
            disabled={pending || !reason.trim()}
            onClick={submitDeletionRequest}
          >
            <Trash2 size={15} aria-hidden className="mr-1.5" />
            {pending ? 'Submitting…' : 'Submit request'}
          </Button>
          {message ? (
            <p className="text-foreground-secondary text-xs" role="status">
              {message}
            </p>
          ) : null}
        </div>
      </div>
      <Link
        to="/privacy"
        className="text-foreground-secondary text-xs hover:underline"
      >
        Read the full privacy policy for @{username}
      </Link>
    </div>
  );
}
