import { Link } from '@tanstack/react-router';
import {
  Bell,
  Cast,
  CircleHelpIcon,
  Compass,
  CreditCardIcon,
  Database,
  Download,
  Globe,
  InfoIcon,
  Keyboard,
  KeyRound,
  Landmark,
  LayoutGrid,
  Lock,
  LogInIcon,
  LogOutIcon,
  Mic,
  Paintbrush,
  Pencil,
  Radio as RadioIcon,
  Settings2 as Settings2Icon,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserCircle2,
  Users,
  Wallet,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  Box,
  Button,
  Dialog,
  Input,
  SaveButton,
  Select,
  Tabs,
  Textarea,
  ThemeController,
  ThemeStoreItem,
  Toggle,
  Tooltip,
  type SelectOption,
} from '@tahti-player/ui';

import {
  fetchChannelMembers,
  fetchDiscoveryPrefs,
  fetchGreenRoomPrefs,
  fetchModerators,
  fetchNotificationPrefs,
  fetchSocialConnections,
  patchDiscoveryPrefs,
  patchGreenRoomPrefs,
  patchNotificationPrefs,
  patchSocialConnections,
  type ChannelMember,
  type DiscoveryPrefs,
  type GreenRoomPrefs,
  type ModeratorRow,
  type NotificationPrefs,
  type SocialConnections,
} from '../../api/artist-settings';
import {
  checkSlugAvailable,
  setCustomDomain,
  updateChannelSlug,
  verifyCustomDomain,
} from '../../api/channel-design';
import {
  cancelMySubscription,
  fetchMembership,
  fetchMyPurchases,
  fetchMySubscriptions,
  requestAccountDeletion,
  startMembershipCheckout,
} from '../../api/client';
import {
  fetchMeProfile,
  fetchProgramme,
  fetchStorageUsage,
  patchMeProfile,
  patchProgramme,
  type ProfileFields,
  type ProgrammeView,
  type StorageUsage,
} from '../../api/studio-extras';
import type {
  FanSubscriptionRow,
  MembershipStatus,
  PurchaseRow,
} from '../../api/types';
import { AMBIENT_SCHEME } from '../../components/AmbientBackground';
import { ApiTokensPanel } from '../../components/ApiTokensPanel';
import { ArtistImagePurposePicker } from '../../components/ArtistImagePurposePicker';
import { ChannelVisualizer } from '../../components/ChannelVisualizer';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { GenrePicker } from '../../components/GenrePicker';
import { MentionTextarea } from '../../components/MentionTextarea';
import { MulticastSection } from '../../components/MulticastSection';
import { PageLoading } from '../../components/PageStates';
import { PluginStorePanel } from '../../components/PluginStorePanel';
import { SecurityTotpPanel } from '../../components/SecurityTotpPanel';
import { SocialLinkIcon } from '../../components/SocialLinkIcon';
import { ThemeEditor } from '../../components/ThemeEditor';
import {
  isThemeVisualizationEnabled,
  ThemeVisualizationSettings,
} from '../../components/ThemeVisualizationSettings';
import { COUNTRIES, flagEmoji } from '../../lib/countries';
import {
  formatGenreTags,
  MAX_GENRES,
  normalizeGenresForPicker,
  parseGenreTags,
} from '../../lib/genres';
import { membershipStatusLabel } from '../../lib/membershipStatus';
import {
  readReleaseVisualizerPreference,
  releaseVisualizerPresets,
  saveReleaseVisualizerPreference,
  type ReleaseVisualizerMode,
} from '../../lib/releaseVisualizer';
import { useThemeStore } from '../../plugins/themes';
import { useAmbientStore } from '../../stores/ambientStore';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { useChannelShareStore } from '../../stores/channelShareStore';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { StudioBrandingPanel } from '../studio/StudioBrandingView';
import { StudioModerationView } from '../studio/StudioModerationView';
import { WhatsNewPanel } from '../WhatsNewView';
import { SettingsHint, SettingsInfo, SettingsToggle } from './SettingsFields';
import { SETTINGS_NAV, type SettingsSectionId } from './settingsNav';

const GovernanceView = lazy(() =>
  import('../GovernanceView').then((module) => ({
    default: module.GovernanceView,
  })),
);

const PRONOUN_OPTIONS: SelectOption[] = [
  { id: 'she/her', label: 'she/her' },
  { id: 'he/him', label: 'he/him' },
  { id: 'they/them', label: 'they/them' },
  { id: 'she/they', label: 'she/they' },
  { id: 'he/they', label: 'he/they' },
  { id: 'other', label: 'Other' },
];

const ARTIST_ROLE_OPTIONS = [
  ['producer', 'Producer'],
  ['dj', 'DJ'],
  ['band', 'Band'],
  ['live-performer', 'Live performer'],
  ['instrumentalist', 'Instrumentalist'],
  ['singer', 'Singer / vocalist'],
  ['songwriter', 'Songwriter'],
  ['composer', 'Composer'],
  ['sound-engineer', 'Sound engineer'],
  ['visual-artist', 'Visual artist'],
  ['curator', 'Curator / label'],
] as const;

function parseArtistRoles(profile: ProfileFields): string[] {
  return (profile.socialLinks?.artistRoles ?? '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

function detectCountryCode(): string | null {
  if (typeof navigator === 'undefined') {
    return null;
  }
  const locales = [navigator.language, ...(navigator.languages ?? [])];
  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region;
      if (region && COUNTRIES.some((country) => country.code === region)) {
        return region;
      }
    } catch {
      continue;
    }
  }
  return null;
}
const PRONOUN_PRESET_IDS = new Set(
  PRONOUN_OPTIONS.map((o) => o.id).filter((id) => id !== 'other'),
);

function euros(cents: number | string): string {
  const n = typeof cents === 'string' ? Number(cents) : cents;
  if (!Number.isFinite(n)) {
    return '—';
  }
  return `€${(n / 100).toFixed(n % 100 === 0 ? 0 : 2)}`;
}

export function SettingsSectionBody({
  section,
}: {
  section: SettingsSectionId;
}) {
  let content: ReactNode;
  const [showAddonInfo, setShowAddonInfo] = useState(false);

  switch (section) {
    case 'account':
      content = <AccountPanel />;
      break;
    case 'artist':
      content = <ArtistPanel />;
      break;
    case 'channel':
      content = <ChannelPanel />;
      break;
    case 'broadcast':
      content = <BroadcastPanel />;
      break;
    case 'themes':
      content = <ThemesPanel />;
      break;
    case 'plugin-store':
      content = <PluginStorePanel />;
      break;
    case 'whats-new':
      content = <WhatsNewPanel />;
      break;
    default:
      return null;
  }

  const navItem = SETTINGS_NAV.find((item) => item.id === section);
  const isAddonStore = section === 'plugin-store';

  useEffect(() => {
    if (!isAddonStore) {
      setShowAddonInfo(false);
    }
  }, [isAddonStore]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {navItem?.label}
          </h1>
          {isAddonStore ? (
            <Tooltip
              content={`About ${navItem?.label ?? 'Add-ons'}`}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={`About ${navItem?.label ?? 'Add-ons'}`}
                aria-expanded={showAddonInfo}
                onClick={() => setShowAddonInfo((value) => !value)}
              >
                <InfoIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
        </div>
        {isAddonStore ? (
          showAddonInfo && navItem?.description ? (
            <Box
              variant="tertiary"
              role="note"
              className="border-primary/40 bg-primary/10 flex-row items-start gap-2 py-3"
            >
              <InfoIcon
                className="text-primary mt-0.5 shrink-0"
                size={16}
                aria-hidden
              />
              <p className="text-foreground text-sm">{navItem.description}</p>
            </Box>
          ) : null
        ) : (
          <p className="text-foreground-secondary text-sm">
            {navItem?.description}
          </p>
        )}
      </header>
      {content}
    </div>
  );
}

function MembershipCheckoutButton({
  onActivated,
}: {
  onActivated?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setMsg(null);
          void startMembershipCheckout().then((res) => {
            setBusy(false);
            if (!res.ok) {
              setMsg(res.error);
              return;
            }
            if ('checkoutUrl' in res && res.checkoutUrl) {
              window.location.assign(res.checkoutUrl);
              return;
            }
            if ('activated' in res && res.activated) {
              setMsg(
                res.memberNumber != null
                  ? `Membership activated — member #${res.memberNumber}.`
                  : 'Membership activated.',
              );
              onActivated?.();
            }
          });
        }}
      >
        <CreditCardIcon size={15} aria-hidden className="mr-1.5" />
        {busy ? 'Starting…' : 'Pay €40 / year'}
      </Button>
      {msg && <p className="text-xs">{msg}</p>}
    </div>
  );
}

function AccountPanel() {
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
          content: (
            <div className="flex flex-col gap-3">
              {!membership ? (
                <SettingsHint>Could not load membership.</SettingsHint>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <SettingsInfo
                    label="Status"
                    value={membershipStatusLabel(membership)}
                  />
                  <SettingsInfo
                    label="Member"
                    value={membership.isMember ? 'Yes' : 'No'}
                  />
                  {membership.memberNumber != null && (
                    <SettingsInfo
                      label="Member #"
                      value={String(membership.memberNumber)}
                    />
                  )}
                  {membership.tier && (
                    <SettingsInfo label="Tier" value={membership.tier} />
                  )}
                  {typeof membership.priceCents === 'number' && (
                    <SettingsInfo
                      label="Dues"
                      value={`${euros(membership.priceCents)} / year`}
                    />
                  )}
                  {membership.renewalDueAt && (
                    <SettingsInfo
                      label="Renewal"
                      value={new Date(
                        membership.renewalDueAt,
                      ).toLocaleDateString()}
                    />
                  )}
                  {!membership.isMember && (
                    <div className="flex flex-col gap-2">
                      <p className="text-foreground-secondary text-xs">
                        Tahti ry membership is €40/year — cooperative vote,
                        FLAC, and stash.
                      </p>
                      <MembershipCheckoutButton
                        onActivated={() => {
                          void fetchMembership().then((r) => {
                            setMembership(r.data);
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
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

/** Optional pronouns dropdown — common options plus a free-text "Other". */
function PronounsField({
  profile,
  setProfile,
}: {
  profile: ProfileFields;
  setProfile: (p: ProfileFields) => void;
}) {
  const current = profile.pronouns ?? '';
  const isCustom = current !== '' && !PRONOUN_PRESET_IDS.has(current);
  const [showCustomInput, setShowCustomInput] = useState(isCustom);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-fit min-w-40">
        <Select
          label="Pronouns"
          value={showCustomInput ? 'other' : current}
          onValueChange={(id) => {
            if (id === 'other') {
              setShowCustomInput(true);
              return;
            }
            setShowCustomInput(false);
            setProfile({ ...profile, pronouns: id });
          }}
          placeholder="Not set"
          options={PRONOUN_OPTIONS}
        />
      </div>
      {showCustomInput && (
        <Input
          label="Custom pronouns"
          value={isCustom ? current : ''}
          onChange={(e) => setProfile({ ...profile, pronouns: e.target.value })}
        />
      )}
    </div>
  );
}

function ArtistPanel() {
  const user = useAuthStore((s) => s.user);
  const refreshAuth = useAuthStore((s) => s.refresh);
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [social, setSocial] = useState<SocialConnections | null>(null);
  const [artistRoles, setArtistRoles] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [socialMsg, setSocialMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetchMeProfile(),
      fetchChannelMembers(),
      fetchSocialConnections(),
    ]).then(([p, m, s]) => {
      const detectedCountry = p.data.countryCode ? null : detectCountryCode();
      setProfile(
        detectedCountry ? { ...p.data, countryCode: detectedCountry } : p.data,
      );
      setMembers(m.data);
      setSocial(s.data);
      setArtistRoles(parseArtistRoles(p.data));
    });
  }, []);

  const saveArtistInfo = () => {
    if (!profile) {
      return;
    }
    setBusy(true);
    void patchMeProfile({
      displayName: profile.displayName.trim(),
      bio: profile.bio?.trim() || null,
      fullBio: profile.fullBio?.trim() || null,
      tipJarUrl: profile.tipJarUrl?.trim() || null,
      pronouns: profile.pronouns?.trim() || null,
      chatEnabled: profile.chatEnabled,
      showFollowers: profile.showFollowers,
      showFollowing: profile.showFollowing,
      artistKind: profile.artistKind ?? 'SINGLE',
      countryCode: profile.countryCode,
      defaultLocation: profile.defaultLocation?.trim() || null,
      socialLinks: {
        ...(profile.socialLinks ?? {}),
        artistRoles: artistRoles.join(', '),
      },
    }).then((result) => {
      setBusy(false);
      setMsg(result.ok ? 'Artist info saved.' : result.error);
      if (result.ok) {
        setProfile(result.data);
        void refreshAuth();
        toast.success('Artist info saved.');
      } else {
        toast.error(result.error);
      }
    });
  };

  if (!user) {
    return (
      <SettingsHint>
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={() => useAuthModalStore.getState().open('login')}
        >
          Sign in
        </button>{' '}
        to edit artist profile.
      </SettingsHint>
    );
  }

  return (
    <Tabs
      listClassName="flex-wrap"
      items={[
        {
          id: 'identity',
          label: 'Identity',
          icon: <UserCircle2 size={14} />,
          content: !profile ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <Input
                label="Display name"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
              />
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    What do you do?
                  </p>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Choose the creative roles you want listeners to associate
                    with you.
                  </p>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Creative roles"
                >
                  {ARTIST_ROLE_OPTIONS.map(([id, label]) => {
                    const selected = artistRoles.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setArtistRoles((current) =>
                            selected
                              ? current.filter((role) => role !== id)
                              : [...current, id],
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-foreground-secondary hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-foreground-secondary text-xs">
                  Selected:{' '}
                  {artistRoles.length > 0
                    ? artistRoles
                        .map(
                          (role) =>
                            ARTIST_ROLE_OPTIONS.find(
                              ([id]) => id === role,
                            )?.[1] ?? role,
                        )
                        .join(', ')
                    : 'None yet'}
                </p>
              </div>
              <ArtistImagePurposePicker
                avatarUrl={profile.avatarUrl}
                displayName={profile.displayName}
                onProfileUploaded={(avatarUrl) => {
                  setProfile({ ...profile, avatarUrl });
                  void refreshAuth();
                  toast.success('Profile image updated.');
                }}
                onGalleryUploaded={() => {
                  toast.success('Image added to your gallery.');
                }}
              />
              <PronounsField profile={profile} setProfile={setProfile} />
              <Select
                label="Country"
                value={profile.countryCode ?? ''}
                onValueChange={(value) =>
                  setProfile({
                    ...profile,
                    countryCode: value || null,
                  })
                }
                options={[
                  { id: '', label: 'Prefer not to say' },
                  ...COUNTRIES.map((c) => ({
                    id: c.code,
                    label: `${flagEmoji(c.code)} ${c.name}`,
                  })),
                ]}
              />
              {profile.countryCode && (
                <Input
                  label="City / location"
                  value={profile.defaultLocation ?? ''}
                  onChange={(e) =>
                    setProfile({ ...profile, defaultLocation: e.target.value })
                  }
                  description="Optional — shown on your public profile"
                />
              )}
              <Input
                label="Tip jar URL"
                value={profile.tipJarUrl ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, tipJarUrl: e.target.value })
                }
              />
              <div className="flex justify-end">
                <SaveButton
                  saving={busy}
                  label="Save identity"
                  onClick={saveArtistInfo}
                />
              </div>
              {msg && <SettingsHint>{msg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'story',
          label: 'Story',
          icon: <UserCircle2 size={14} />,
          content: !profile ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <MentionTextarea
                label="Short bio"
                rows={4}
                value={profile.bio ?? ''}
                onChange={(bio) => setProfile({ ...profile, bio })}
                placeholder="The concise introduction shown on your profile."
              />
              <MentionTextarea
                label="Your story"
                rows={8}
                value={profile.fullBio ?? ''}
                onChange={(fullBio) => setProfile({ ...profile, fullBio })}
                placeholder="Share your history, influences, milestones, and what listeners should know."
              />
              <div className="flex justify-end">
                <SaveButton
                  saving={busy}
                  label="Save story"
                  onClick={saveArtistInfo}
                />
              </div>
              {msg && <SettingsHint>{msg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'people',
          label: 'People',
          icon: <Users size={14} />,
          content: (
            <div className="flex flex-col gap-5">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-foreground text-sm font-semibold">
                  Project type
                </span>
                <span className="text-foreground-secondary text-xs">
                  Tell listeners whether this profile represents one artist or a
                  collective.
                </span>
                <div className="flex gap-2">
                  {(
                    [
                      ['SINGLE', 'Solo artist'],
                      ['COLLECTIVE', 'Band / collective'],
                    ] as const
                  ).map(([kind, label]) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={(profile?.artistKind ?? 'SINGLE') === kind}
                      onClick={() =>
                        profile && setProfile({ ...profile, artistKind: kind })
                      }
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        (profile?.artistKind ?? 'SINGLE') === kind
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground-secondary hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </label>
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-foreground text-sm font-semibold">
                    Members and credits
                  </h3>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    People shown alongside this project on its public artist
                    page.
                  </p>
                </div>
                {members.length === 0 ? (
                  <SettingsHint>No members listed.</SettingsHint>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span>
                          {member.displayName} (@{member.username})
                        </span>
                        <span className="text-foreground-secondary text-xs uppercase">
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end">
                <SaveButton
                  saving={busy}
                  label="Save people settings"
                  onClick={saveArtistInfo}
                />
              </div>
              {msg && <SettingsHint>{msg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'connections',
          label: 'Connections',
          icon: <Share2 size={14} />,
          content: !social ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <SettingsHint>
                Add the places listeners can find you. These links appear as
                branded buttons on your public artist profile.
              </SettingsHint>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['website', 'Website'],
                    ['instagram', 'Instagram'],
                    ['bandcamp', 'Bandcamp'],
                    ['soundcloud', 'SoundCloud'],
                    ['youtube', 'YouTube'],
                    ['hearthisAt', 'hearthis.at'],
                    ['mixcloud', 'Mixcloud'],
                    ['twitch', 'Twitch'],
                    ['kick', 'Kick'],
                    ['spotify', 'Spotify'],
                    ['discord', 'Discord'],
                    ['tiktok', 'TikTok'],
                    ['twitter', 'X / Twitter'],
                    ['facebook', 'Facebook'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
                      <SocialLinkIcon label={label} url={social[key]} />
                      {label}
                    </span>
                    <Input
                      aria-label={label}
                      value={social[key]}
                      placeholder={`https://…/${label.toLowerCase()}`}
                      onChange={(e) =>
                        setSocial({ ...social, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <SaveButton
                  label="Save social links"
                  onClick={() => {
                    if (!social) {
                      return;
                    }
                    const { showConnections, ...connectionValues } = social;
                    void Promise.all([
                      patchSocialConnections(connectionValues),
                      patchMeProfile({
                        socialLinks: {
                          ...(profile?.socialLinks ?? {}),
                          ...connectionValues,
                          showConnections: String(showConnections),
                        },
                      }),
                    ]).then(([connectionsResult, profileResult]) => {
                      const error = !connectionsResult.ok
                        ? connectionsResult.error
                        : !profileResult.ok
                          ? profileResult.error
                          : null;
                      setSocialMsg(error ?? 'Connections saved.');
                      if (!error && connectionsResult.ok) {
                        setSocial({
                          ...connectionsResult.data,
                          showConnections,
                        });
                        toast.success('Connections saved.');
                      }
                    });
                  }}
                />
              </div>
              {socialMsg && <SettingsHint>{socialMsg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'branding',
          label: 'Branding',
          icon: <Paintbrush size={14} />,
          content: <StudioBrandingPanel section="branding" />,
        },
        {
          id: 'release-visuals',
          label: 'Releases',
          icon: <Sparkles size={14} />,
          content: <ReleaseVisualDefaultsPanel />,
        },
      ].filter(
        (item) => item.id !== 'people' || profile?.artistKind === 'COLLECTIVE',
      )}
    />
  );
}

export function ReleaseVisualDefaultsPanel() {
  const [preference, setPreference] = useState(() =>
    readReleaseVisualizerPreference(),
  );

  const update = (patch: Partial<typeof preference>) => {
    const next = { ...preference, ...patch };
    setPreference(next);
    saveReleaseVisualizerPreference(next);
    toast.success('Release visualizer default saved.');
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsHint>
        Choose the animated background used when you create a new release. You
        can still change an individual release later from its visual settings.
      </SettingsHint>
      <Select
        label="New release background"
        value={preference.mode}
        onValueChange={(value) =>
          update({ mode: value as ReleaseVisualizerMode })
        }
        options={[
          { id: 'specific', label: 'Use a specific visualizer' },
          { id: 'random', label: 'Choose a random visualizer' },
          { id: 'off', label: 'Off' },
        ]}
      />
      {preference.mode === 'specific' && (
        <Select
          label="Visualizer"
          value={preference.preset}
          onValueChange={(value) =>
            update({
              preset: value as typeof preference.preset,
            })
          }
          options={releaseVisualizerPresets().map((preset) => ({
            id: preset,
            label: preset
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/^\w/, (letter) => letter.toUpperCase()),
          }))}
        />
      )}
      <p className="text-foreground-secondary text-xs">
        Particle field is selected by default: a soft, audio-reactive cloud that
        keeps cover art readable.
      </p>
    </div>
  );
}

function ChannelPanel() {
  const user = useAuthStore((s) => s.user);
  const closeSettings = useSettingsModalStore((s) => s.close);
  const channel = user?.channel;
  const [discovery, setDiscovery] = useState<DiscoveryPrefs | null>(null);
  const [channelProfile, setChannelProfile] = useState<ProfileFields | null>(
    null,
  );
  const [slug, setSlug] = useState(channel?.slug ?? '');
  const [domain, setDomain] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const shareEnabled = useChannelShareStore(
    (state) => state.enabledByChannel[channel?.slug ?? ''] !== false,
  );
  const setShareEnabled = useChannelShareStore((state) => state.setEnabled);

  useEffect(() => {
    void fetchDiscoveryPrefs().then((r) => setDiscovery(r.data));
    void fetchMeProfile().then((r) => setChannelProfile(r.data));
    setSlug(channel?.slug ?? user?.username ?? '');
  }, [channel?.slug, user?.username]);

  if (!user) {
    return (
      <SettingsHint>
        Sign in with a channel to edit design and discovery.
      </SettingsHint>
    );
  }

  return (
    <Tabs
      listClassName="flex-wrap"
      items={[
        {
          id: 'appearance',
          label: 'Appearance',
          icon: <Paintbrush size={14} />,
          content: (
            <div className="flex flex-col gap-4">
              <SettingsHint>
                Channel look now lives in one place: Studio → Branding → Channel
                Designer.
              </SettingsHint>
              <Link
                to="/studio/branding"
                search={{ tab: 'channel-designer' }}
                onClick={closeSettings}
              >
                <Button size="sm" variant="secondary">
                  Open Channel Designer
                </Button>
              </Link>
            </div>
          ),
        },
        {
          id: 'discovery',
          label: 'Discovery',
          icon: <Compass size={14} />,
          content: !discovery ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <SettingsToggle
                label="Show share button on my channel and Broadcast"
                description="Let listeners and collaborators copy or share your live channel link."
                value={shareEnabled}
                onChange={(value) => {
                  if (channel?.slug) {
                    setShareEnabled(channel.slug, value);
                  }
                }}
              />
              <SettingsToggle
                label="List in Listen directory"
                value={discovery.listedInDirectory}
                onChange={(v) => {
                  const next = { ...discovery, listedInDirectory: v };
                  setDiscovery(next);
                  void patchDiscoveryPrefs({ listedInDirectory: v });
                }}
              />
              <SettingsToggle
                label="Allow Tahti Radio pickup"
                value={discovery.allowRadioPickup}
                onChange={(v) => {
                  const next = { ...discovery, allowRadioPickup: v };
                  setDiscovery(next);
                  void patchDiscoveryPrefs({ allowRadioPickup: v });
                }}
              />
              <SettingsToggle
                label="Featured on Listen home"
                description="Subject to editorial / algorithmic placement."
                value={discovery.showOnListenHome}
                onChange={(v) => {
                  const next = { ...discovery, showOnListenHome: v };
                  setDiscovery(next);
                  void patchDiscoveryPrefs({ showOnListenHome: v });
                }}
              />
              <label className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-semibold">
                  Genres
                </span>
                <span className="text-foreground-secondary text-sm select-none">
                  Up to {MAX_GENRES} — helps listeners find you.
                </span>
                <GenrePicker
                  value={normalizeGenresForPicker(
                    parseGenreTags(discovery.genreTags),
                  )}
                  onChange={(genres) => {
                    const genreTags = formatGenreTags(genres);
                    setDiscovery({ ...discovery, genreTags });
                    void patchDiscoveryPrefs({ genreTags });
                  }}
                />
              </label>
              {channelProfile && (
                <SettingsToggle
                  label="Enable live chat on my channel"
                  description="Allow listeners to chat while you are broadcasting."
                  value={channelProfile.chatEnabled}
                  onChange={(value) => {
                    const previous = channelProfile.chatEnabled;
                    setChannelProfile({
                      ...channelProfile,
                      chatEnabled: value,
                    });
                    void patchMeProfile({ chatEnabled: value }).then(
                      (result) => {
                        if (!result.ok) {
                          setChannelProfile({
                            ...channelProfile,
                            chatEnabled: previous,
                          });
                          toast.error(result.error);
                          return;
                        }
                        setChannelProfile(result.data);
                        toast.success('Channel chat setting saved.');
                      },
                    );
                  }}
                />
              )}
            </div>
          ),
        },
        {
          id: 'domain',
          label: 'Username & domain',
          icon: <Globe size={14} />,
          content: (
            <div className="flex flex-col gap-6">
              <Input
                label="Channel slug / username"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void checkSlugAvailable(slug.trim()).then((r) => {
                      setNote(
                        r.available
                          ? 'Available'
                          : `Not available${r.reason ? ` (${r.reason})` : ''}`,
                      );
                    });
                  }}
                >
                  Check availability
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    void updateChannelSlug(slug.trim()).then((r) => {
                      setNote(r.ok ? `Renamed to ${r.slug}` : r.error);
                    });
                  }}
                >
                  Rename
                </Button>
              </div>
              <Input
                label="Custom domain"
                description={
                  channel?.customDomain
                    ? `Current: ${channel.customDomain}${channel.customDomainVerified ? ' (verified)' : ' (pending)'}`
                    : 'Requires membership. Add DNS TXT then verify.'
                }
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="music.example.com"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    void setCustomDomain(domain.trim()).then((r) => {
                      if (!r.ok) {
                        setNote(r.error);
                      } else {
                        setNote(
                          `Add TXT ${r.txtHost} = ${r.txtRecord}, then Verify.`,
                        );
                      }
                    });
                  }}
                >
                  Set domain
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void verifyCustomDomain().then((r) => {
                      setNote(
                        r.ok
                          ? r.verified
                            ? 'Verified!'
                            : 'Not verified yet'
                          : r.error,
                      );
                    });
                  }}
                >
                  Verify DNS
                </Button>
              </div>
              {note && <SettingsHint>{note}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'moderation',
          label: 'Moderation',
          icon: <Shield size={14} />,
          content: <StudioModerationView embedded />,
        },
      ]}
    />
  );
}

export type BroadcastSection = 'radio' | 'green-room' | 'multistream';

export function BroadcastPanel({
  section,
}: {
  section?: BroadcastSection;
} = {}) {
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [green, setGreen] = useState<GreenRoomPrefs | null>(null);
  const [mods, setMods] = useState<ModeratorRow[]>([]);

  useEffect(() => {
    void Promise.all([
      fetchProgramme(),
      fetchGreenRoomPrefs(),
      fetchModerators(),
    ]).then(([p, g, m]) => {
      setProgramme(p.data);
      setGreen(g.data);
      setMods(m.data);
    });
  }, []);

  const items = [
    {
      id: 'radio',
      label: 'Radio',
      icon: <RadioIcon size={14} />,
      content: !programme ? (
        <SettingsHint>Loading…</SettingsHint>
      ) : (
        <div className="flex flex-col gap-6">
          <SettingsToggle
            label="Announcements enabled"
            description="Allow platform/radio announcements on your channel programme."
            value={programme.announcementsEnabled}
            onChange={(v) => {
              const next = { ...programme, announcementsEnabled: v };
              setProgramme(next);
              void patchProgramme({ announcementsEnabled: v });
            }}
          />
          <SettingsToggle
            label="Fallback / autoplay when offline"
            value={programme.fallbackEnabled}
            onChange={(v) => {
              const next = { ...programme, fallbackEnabled: v };
              setProgramme(next);
              void patchProgramme({ fallbackEnabled: v });
            }}
          />
          <SettingsToggle
            label="Auto-enroll new archive into fallback"
            value={programme.fallbackAutoEnroll}
            onChange={(v) => {
              const next = { ...programme, fallbackAutoEnroll: v };
              setProgramme(next);
              void patchProgramme({ fallbackAutoEnroll: v });
            }}
          />
          <Link to="/studio/schedule" onClick={closeSettings}>
            <Button size="sm" variant="secondary">
              Open schedule / programme
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'green-room',
      label: 'Green room',
      icon: <Mic size={14} />,
      content: !green ? (
        <SettingsHint>Loading…</SettingsHint>
      ) : (
        <div className="flex flex-col gap-6">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground text-sm font-semibold">
              Who can join
            </span>
            <div className="flex gap-2">
              {(
                [
                  ['everyone', 'Everyone'],
                  ['subscribers', 'Subscribers only'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={green.access === value}
                  onClick={() => {
                    setGreen({ ...green, access: value });
                    void patchGreenRoomPrefs({ access: value });
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    green.access === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-foreground-secondary text-xs">
              Anyone signed in, or only listeners with an active fan
              subscription to you.
            </span>
          </label>
          <Input
            label="Default show title"
            value={green.defaultTitle}
            onChange={(e) =>
              setGreen({ ...green, defaultTitle: e.target.value })
            }
            onBlur={() =>
              void patchGreenRoomPrefs({
                defaultTitle: green.defaultTitle,
              })
            }
          />
          <Input
            label="Default note"
            value={green.defaultNote}
            onChange={(e) =>
              setGreen({ ...green, defaultNote: e.target.value })
            }
            onBlur={() =>
              void patchGreenRoomPrefs({ defaultNote: green.defaultNote })
            }
          />
          <SettingsToggle
            label="Auto-announce when going live"
            value={green.autoAnnounce}
            onChange={(v) => {
              setGreen({ ...green, autoAnnounce: v });
              void patchGreenRoomPrefs({ autoAnnounce: v });
            }}
          />
          <SettingsToggle
            label="Hold music while waiting for signal"
            value={green.holdMusicEnabled}
            onChange={(v) => {
              setGreen({ ...green, holdMusicEnabled: v });
              void patchGreenRoomPrefs({ holdMusicEnabled: v });
            }}
          />
          <Link to="/studio/go-live" onClick={closeSettings}>
            <Button size="sm" variant="secondary">
              Broadcast
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'moderators',
      label: 'Moderators',
      icon: <Shield size={14} />,
      content: (
        <div className="flex flex-col gap-4">
          <SettingsHint>Chat moderators for your live channel.</SettingsHint>
          {mods.length === 0 ? (
            <SettingsHint>No moderators yet.</SettingsHint>
          ) : (
            <ul className="flex flex-col gap-2">
              {mods.map((m) => (
                <li
                  key={m.id}
                  className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    {m.displayName} (@{m.username})
                  </span>
                  <span className="text-foreground-secondary text-xs">
                    {m.canTimeout ? 'timeout' : ''}
                    {m.canTimeout && m.canDelete ? ', ' : ''}
                    {m.canDelete ? 'delete' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <SettingsHint>
            View the current team here. Manage invitations and permissions from
            your account on tahti.live.
          </SettingsHint>
        </div>
      ),
    },
    {
      id: 'multistream',
      label: 'Multistream',
      icon: <Cast size={14} />,
      content: <MulticastSection />,
    },
  ];

  if (section) {
    return (
      <div className="flex flex-col gap-6">
        {items.find((item) => item.id === section)?.content}
      </div>
    );
  }

  return <Tabs listClassName="flex-wrap" items={items} />;
}

function NotificationsPanel() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    void fetchNotificationPrefs().then((r) => setPrefs(r.data));
  }, []);

  const set = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) {
      return;
    }
    const previous = prefs[key];
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const result = await patchNotificationPrefs({ [key]: value });
    if (!result.ok) {
      setPrefs({ ...next, [key]: previous });
      toast.error(result.error);
      return;
    }
    setPrefs(result.data);
    toast.success('Notification preference saved.');
  };

  if (!prefs) {
    return <SettingsHint>Loading…</SettingsHint>;
  }

  const toggle = (key: keyof NotificationPrefs, value: boolean) => {
    void set(key, value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
        <h3 className="font-display text-base font-bold">Money moves</h3>
        <p className="text-foreground-secondary mt-1 text-sm">
          When fan subscriptions arrive or payouts complete.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <SettingsToggle
            label="Email me"
            value={prefs.notifyMoneyMovesEmail}
            onChange={(value) => toggle('notifyMoneyMovesEmail', value)}
          />
          <SettingsToggle
            label="In-app"
            value={prefs.notifyMoneyMovesInApp}
            onChange={(value) => toggle('notifyMoneyMovesInApp', value)}
          />
        </div>
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          Tahti · @aurora_fi subscribed (€5/mo)
        </p>
      </div>
      <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
        <h3 className="font-display text-base font-bold">Listener actions</h3>
        <p className="text-foreground-secondary mt-1 text-sm">
          A daily email digest of new chat messages, comments, and broadcast
          feedback.
        </p>
        <div className="mt-4">
          <SettingsToggle
            label="Email digest, daily"
            value={prefs.notifyListenerActivityEmail}
            onChange={(value) => toggle('notifyListenerActivityEmail', value)}
          />
        </div>
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          Tahti · 3 new chat messages, 1 new comment on Drift EP
        </p>
      </div>
      <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
        <h3 className="font-display text-base font-bold">Weekly recap</h3>
        <p className="text-foreground-secondary mt-1 text-sm">
          A Sunday summary of your activity and audience.
        </p>
        <div className="mt-4">
          <SettingsToggle
            label="Email me"
            value={prefs.notifyWeeklyRecapEmail}
            onChange={(value) => toggle('notifyWeeklyRecapEmail', value)}
          />
        </div>
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          Tahti · 1,247 plays · 89 downloads · €115 this week
        </p>
      </div>
    </div>
  );
}

function NotificationsVisibilityPanel() {
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryPrefs | null>(null);
  const [savingKey, setSavingKey] = useState<keyof ProfileFields | null>(null);
  const [savingDiscovery, setSavingDiscovery] = useState(false);

  useEffect(() => {
    void Promise.all([fetchMeProfile(), fetchDiscoveryPrefs()]).then(
      ([profileResult, discoveryResult]) => {
        setProfile(profileResult.data);
        setDiscovery(discoveryResult.data);
      },
    );
  }, []);

  const updateVisibility = (
    key:
      | 'showJoinDate'
      | 'showFollowers'
      | 'showFollowing'
      | 'showDailyListeners',
    value: boolean,
  ) => {
    if (!profile) {
      return;
    }
    const previous = profile[key] ?? true;
    setProfile({ ...profile, [key]: value });
    setSavingKey(key);
    void patchMeProfile({ [key]: value }).then((result) => {
      setSavingKey(null);
      if (!result.ok) {
        setProfile({ ...profile, [key]: previous });
        toast.error(result.error);
        return;
      }
      setProfile(result.data);
      toast.success('Visibility setting saved.');
    });
  };

  const updateConnectionsVisibility = (value: boolean) => {
    if (!profile) {
      return;
    }
    const previous = profile.socialLinks;
    setProfile({
      ...profile,
      socialLinks: { ...(previous ?? {}), showConnections: String(value) },
    });
    setSavingKey('chatEnabled');
    void patchMeProfile({
      socialLinks: { ...(previous ?? {}), showConnections: String(value) },
    }).then((result) => {
      setSavingKey(null);
      if (!result.ok) {
        setProfile({ ...profile, socialLinks: previous });
        toast.error(result.error);
        return;
      }
      setProfile(result.data);
      toast.success('Visibility setting saved.');
    });
  };

  const updateDiscovery = (
    key: keyof Pick<DiscoveryPrefs, 'showFavorites' | 'announceReleases'>,
    value: boolean,
  ) => {
    if (!discovery) {
      return;
    }
    setDiscovery({ ...discovery, [key]: value });
    setSavingDiscovery(true);
    void patchDiscoveryPrefs({ [key]: value }).then((result) => {
      setSavingDiscovery(false);
      if (!result.ok) {
        setDiscovery(discovery);
        toast.error(result.error);
        return;
      }
      setDiscovery(result.data);
      toast.success('Notification setting saved.');
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Visibility
        </h2>
        <p className="text-foreground-secondary mt-1 text-sm">
          Choose what appears publicly on your profile and channel.
        </p>
      </div>
      {!profile || !discovery ? (
        <SettingsHint>Loading…</SettingsHint>
      ) : (
        <div className="flex flex-col gap-5">
          <SettingsToggle
            label="Show join date on my profile"
            value={profile.showJoinDate ?? true}
            onChange={(value) => updateVisibility('showJoinDate', value)}
          />
          <SettingsToggle
            label="Show my followers on my profile"
            value={profile.showFollowers ?? true}
            onChange={(value) => updateVisibility('showFollowers', value)}
          />
          <SettingsToggle
            label="Show who I follow on my profile"
            value={profile.showFollowing ?? true}
            onChange={(value) => updateVisibility('showFollowing', value)}
          />
          <SettingsToggle
            label="Show today’s listener count in my chat"
            value={profile.showDailyListeners ?? true}
            onChange={(value) => updateVisibility('showDailyListeners', value)}
          />
          <SettingsToggle
            label="Show my connections on my artist profile"
            value={profile.socialLinks?.showConnections !== 'false'}
            onChange={updateConnectionsVisibility}
          />
          <SettingsToggle
            label="Show favourites"
            description="Your favourited tracks and channels are visible on your public profile."
            value={discovery.showFavorites}
            onChange={(value) => updateDiscovery('showFavorites', value)}
          />
        </div>
      )}
      <div className="border-border border-t pt-5">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Notifications
        </h2>
        <p className="text-foreground-secondary mt-1 mb-5 text-sm">
          Choose which activity reaches you by email or in the app.
        </p>
        <NotificationsPanel />
        {discovery ? (
          <SettingsToggle
            label="Announce releases"
            description="Followers get a notification (and optional email) when you publish a release."
            value={discovery.announceReleases}
            onChange={(value) => updateDiscovery('announceReleases', value)}
          />
        ) : null}
      </div>
      {savingKey || savingDiscovery ? (
        <p className="text-foreground-secondary text-xs" role="status">
          Saving visibility…
        </p>
      ) : null}
    </div>
  );
}

function ThemesPanel() {
  const {
    themes,
    customThemes,
    themeId,
    dark,
    colorMode,
    setTheme,
    setColorMode,
    importCustomTheme,
    renameCustomTheme,
    removeCustomTheme,
  } = useThemeStore();
  const [themeJson, setThemeJson] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [configuringThemeId, setConfiguringThemeId] = useState<string | null>(
    null,
  );
  const [renamingTheme, setRenamingTheme] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Close the nested "Configure theme" dialog in step with the outer
  // Settings modal, not after it — leaving it open while the parent's own
  // exit animation plays stacks two independently-animating overlays and
  // leaves visible fragments of both mid-transition.
  const settingsOpen = useSettingsModalStore((s) => s.isOpen);
  useEffect(() => {
    if (!settingsOpen) {
      setConfiguringThemeId(null);
    }
  }, [settingsOpen]);
  const ambientPreset = useAmbientStore((s) => s.preset);
  const ambientSpeed = useAmbientStore((s) => s.speed);
  const ambientIntensity = useAmbientStore((s) => s.intensity);

  const customEntries = Object.entries(customThemes);
  const dynamicEnabled = colorMode === 'dynamic';

  const exportTheme = (id: string, theme: (typeof customThemes)[string]) => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${
      theme.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || id
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SettingsHint>
          Choose a palette and the light, dark, or time-of-day appearance that
          suits you.
        </SettingsHint>
        <div className="flex flex-wrap items-center gap-4">
          <ThemeController
            isDark={dark}
            onThemeChange={(nextDark) =>
              setColorMode(nextDark ? 'dark' : 'light')
            }
          />
          <div className="flex items-center gap-2">
            <Toggle
              checked={dynamicEnabled}
              onChange={(enabled) => {
                if (enabled) {
                  setColorMode('dynamic');
                  return;
                }
                setColorMode(dark ? 'dark' : 'light');
              }}
              label="Dynamic theme"
            />
            <span className="text-sm font-medium">Dynamic</span>
            <Tooltip content="Dark from 7pm to 7am, light the rest of the day.">
              <CircleHelpIcon
                size={14}
                className="text-foreground-secondary"
                aria-label="What Dynamic does"
              />
            </Tooltip>
          </div>
        </div>
      </div>

      <Tabs
        listClassName="flex-wrap"
        items={[
          {
            id: 'browse',
            label: 'Browse',
            icon: <LayoutGrid size={14} />,
            content: (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {themes.map((theme) => {
                    const active = theme.id === themeId;
                    const configurable = isThemeVisualizationEnabled(theme.id);
                    return (
                      <ThemeStoreItem
                        key={theme.id}
                        name={theme.name}
                        description="Built-in Nuclear theme"
                        author="Tahti"
                        palette={theme.palette}
                        isInstalled
                        isActive={active}
                        onInstall={() => setTheme(theme.id)}
                        onApply={() => setTheme(theme.id)}
                        labels={{
                          apply: 'Apply',
                          active: 'Active',
                        }}
                        accessory={
                          configurable ? (
                            <Tooltip
                              content={`Configure ${theme.name}`}
                              side="top"
                            >
                              <Button
                                size="icon-sm"
                                variant="secondary"
                                aria-label={`Configure ${theme.name}`}
                                onClick={() => setConfiguringThemeId(theme.id)}
                              >
                                <Settings2Icon size={14} aria-hidden />
                              </Button>
                            </Tooltip>
                          ) : undefined
                        }
                      />
                    );
                  })}
                </div>

                {customEntries.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-foreground-secondary text-xs uppercase">
                      Your imported themes
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {customEntries.map(([id, theme]) => {
                        const active = id === themeId;
                        const configurable = isThemeVisualizationEnabled(id);
                        const palette: [string, string, string, string] = [
                          theme.palette?.[0] ?? '#888888',
                          theme.palette?.[1] ?? '#666666',
                          theme.palette?.[2] ?? '#444444',
                          theme.palette?.[3] ?? '#222222',
                        ];
                        return (
                          <ThemeStoreItem
                            key={id}
                            name={theme.name}
                            description={theme.description ?? 'Imported theme'}
                            author={theme.author ?? 'Imported'}
                            palette={palette}
                            tags={theme.tags}
                            isInstalled
                            isActive={active}
                            onInstall={() => setTheme(id)}
                            onApply={() => setTheme(id)}
                            onUninstall={() => removeCustomTheme(id)}
                            labels={{
                              apply: 'Apply',
                              active: 'Active',
                              uninstall: 'Remove',
                            }}
                            accessory={
                              <>
                                {configurable ? (
                                  <Tooltip
                                    content={`Configure ${theme.name}`}
                                    side="top"
                                  >
                                    <Button
                                      size="icon-sm"
                                      variant="secondary"
                                      aria-label={`Configure ${theme.name}`}
                                      onClick={() => setConfiguringThemeId(id)}
                                    >
                                      <Settings2Icon size={14} aria-hidden />
                                    </Button>
                                  </Tooltip>
                                ) : null}
                                <Tooltip
                                  content={`Rename ${theme.name}`}
                                  side="top"
                                >
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    aria-label={`Rename ${theme.name}`}
                                    onClick={() =>
                                      setRenamingTheme({
                                        id,
                                        name: theme.name,
                                      })
                                    }
                                  >
                                    <Pencil size={14} aria-hidden />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Export theme JSON" side="top">
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    aria-label={`Export ${theme.name} as JSON`}
                                    onClick={() => exportTheme(id, theme)}
                                  >
                                    <Download size={14} aria-hidden />
                                  </Button>
                                </Tooltip>
                              </>
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'editor',
            label: 'Editor',
            icon: <Pencil size={14} />,
            content: <ThemeEditor />,
          },
          {
            id: 'import',
            label: 'Import JSON',
            icon: <Upload size={14} />,
            content: (
              <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
                <h3 className="font-bold">Import a theme</h3>
                <SettingsHint>
                  Paste a theme JSON (matches @tahti-player/themes'
                  AdvancedThemeSchema — version, name, and vars / dark CSS
                  variable overrides) to add it without a code change.
                </SettingsHint>
                <Textarea
                  tone="secondary"
                  className="font-mono text-xs"
                  rows={6}
                  value={themeJson}
                  onChange={(e) => setThemeJson(e.target.value)}
                  placeholder={
                    '{\n  "version": 1,\n  "name": "My theme",\n  "vars": { "primary": "oklch(0.7 0.15 250)" }\n}'
                  }
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={!themeJson.trim()}
                    onClick={() => {
                      let parsed: unknown;
                      try {
                        parsed = JSON.parse(themeJson);
                      } catch {
                        setImportMsg('Not valid JSON.');
                        return;
                      }
                      const result = importCustomTheme(parsed);
                      if (!result.ok) {
                        setImportMsg(result.error);
                      } else {
                        setImportMsg(null);
                        setThemeJson('');
                      }
                    }}
                  >
                    Import & apply
                  </Button>
                  {importMsg && (
                    <span className="text-accent-red text-xs">{importMsg}</span>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      <Dialog.Root
        isOpen={configuringThemeId !== null}
        onClose={() => setConfiguringThemeId(null)}
        className="max-w-lg"
      >
        <Dialog.Title>Configure theme</Dialog.Title>
        <div className="mt-4 flex flex-col gap-4">
          <div className="border-border h-40 overflow-hidden rounded-lg border">
            <ChannelVisualizer
              className="h-full w-full"
              preset={ambientPreset}
              colorScheme={AMBIENT_SCHEME}
              visualSettingsJson={`{"${ambientPreset}":{"speed":${ambientSpeed},"intensity":${ambientIntensity}}}`}
            />
          </div>
          <ThemeVisualizationSettings
            themeId={configuringThemeId ?? undefined}
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>

      <Dialog.Root
        isOpen={renamingTheme !== null}
        onClose={() => setRenamingTheme(null)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (renamingTheme) {
              renameCustomTheme(renamingTheme.id, renamingTheme.name);
            }
            setRenamingTheme(null);
          }}
        >
          <Dialog.Title>Rename theme</Dialog.Title>
          <div className="mt-4">
            <Input
              label="Name"
              value={renamingTheme?.name ?? ''}
              onChange={(e) =>
                setRenamingTheme((cur) =>
                  cur ? { ...cur, name: e.target.value } : cur,
                )
              }
              autoFocus
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button type="submit" disabled={!renamingTheme?.name.trim()}>
              Save
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </div>
  );
}
