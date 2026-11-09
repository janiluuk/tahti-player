import {
  ExternalLinkIcon,
  MessageSquareIcon,
  SendIcon,
  ShieldAlertIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonLink,
  EditIconButton,
  Input,
  MediaArtwork,
  SaveButton,
  Select,
  Textarea,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchAdminUser,
  patchAdminUser,
  suspendAdminUser,
  unsuspendAdminUser,
  type AdminUserDetail,
} from '../api/admin';
import { fetchProfile } from '../api/client';
import {
  fetchConversation,
  sendDm,
  startConversation,
  type ChatDm,
} from '../api/messages';
import type { AccountRole, PublicProfile } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { AdminChannelKindControl } from './admin-user/AdminChannelKindControl';
import { AdminUserDeletePanel } from './admin-user/AdminUserDeletePanel';
import { AdminUserEngagementPanel } from './admin-user/AdminUserEngagementPanel';
import { AdminUserRestrictionsPanel } from './admin-user/AdminUserRestrictionsPanel';
import { ImageLightbox } from './ImageLightbox';
import { ListingDate } from './ListingDate';
import { PageEmpty, PageError, PageLoading } from './PageStates';
import { StudioPanel } from './StudioPanel';

const ROLES = ['BOARD', 'ARTIST', 'LISTENER'] as const;

/** The user identity/role/membership/suspension editor Admin → Users uses
 * for its selected-user detail column — extracted so any other admin
 * surface (e.g. Admin → Storage's file list) can open the exact same
 * editor for a user by id, instead of a second, drifting implementation. */
export function AdminUserEditPanel({
  userId,
  onUserUpdated,
  onUserDeleted,
}: {
  userId: string;
  onUserUpdated?: (user: AdminUserDetail) => void;
  onUserDeleted?: (userId: string) => void;
}) {
  const { t } = useTranslation('web');
  const me = useAuthStore((s) => s.user);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editRole, setEditRole] = useState<AccountRole>('LISTENER');
  const [editMember, setEditMember] = useState(false);
  const [editMemberNumber, setEditMemberNumber] = useState('');
  const [accountEditing, setAccountEditing] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatDm[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [messageOpen, setMessageOpen] = useState(false);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(
    null,
  );
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailAttempt, setDetailAttempt] = useState(0);

  const syncDetail = (user: AdminUserDetail) => {
    setDetail(user);
    setEditRole(user.role);
    setEditMember(user.isMember);
    setEditMemberNumber(user.memberNumber?.toString() ?? '');
    onUserUpdated?.(user);
  };

  useEffect(() => {
    setStatus(null);
    setAccountEditing(false);
    setMessageOpen(false);
    setConversationId(null);
    setMessages([]);
    setPublicProfile(null);
    setAvatarOpen(false);
    setDetailLoading(true);
    void fetchAdminUser(userId).then((result) => {
      if (result.data) {
        syncDetail(result.data);
        void fetchProfile(result.data.username)
          .then((profileResult) => setPublicProfile(profileResult.data))
          .catch(() => setPublicProfile(null));
      } else {
        setDetail(null);
      }
      setDetailError(result.data ? null : (result.meta.reason ?? null));
      setDetailLoading(false);
    });
  }, [userId, detailAttempt]);

  const saveUser = async () => {
    if (!detail) {
      return;
    }
    setBusy(true);
    setStatus(null);
    const parsedMemberNumber = editMemberNumber.trim()
      ? Number(editMemberNumber)
      : null;
    if (
      parsedMemberNumber !== null &&
      (!Number.isInteger(parsedMemberNumber) || parsedMemberNumber <= 0)
    ) {
      setBusy(false);
      setStatus('Member number must be a positive whole number.');
      return;
    }
    const result = await patchAdminUser(detail.id, {
      role: editRole,
      isMember: editMember,
      memberNumber: parsedMemberNumber,
    });
    setBusy(false);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    syncDetail(result.data);
    setStatus('User details saved.');
    setAccountEditing(false);
  };

  const toggleSuspension = async () => {
    if (!detail) {
      return;
    }
    if (!detail.suspendedAt && !suspendReason.trim()) {
      setStatus('Add a reason before suspending this account.');
      return;
    }
    setBusy(true);
    setStatus(null);
    const result = detail.suspendedAt
      ? await unsuspendAdminUser(detail.id)
      : await suspendAdminUser(detail.id, suspendReason.trim());
    setBusy(false);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    syncDetail(result.data);
    setSuspendReason('');
    setStatus(
      result.data.suspendedAt
        ? t('adminUserEditPanelStates.accountSuspendedTheyWereEmailed')
        : t('adminUserEditPanelStates.accountRestoredTheyWereEmailed'),
    );
  };

  const openConversation = async () => {
    if (!detail) {
      return;
    }
    setBusy(true);
    setStatus(null);
    const started = await startConversation(detail.username);
    if (!started.ok) {
      setBusy(false);
      setStatus(started.error);
      return;
    }
    const thread = await fetchConversation(started.conversationId);
    setConversationId(started.conversationId);
    setMessages(thread.data?.messages ?? []);
    setMessageOpen(true);
    setBusy(false);
  };

  const sendMessage = async () => {
    if (!conversationId || !messageBody.trim()) {
      return;
    }
    setBusy(true);
    setStatus(null);
    const result = await sendDm(conversationId, messageBody.trim());
    setBusy(false);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    setMessages((current) => [...current, result.data]);
    setMessageBody('');
  };

  if (detailLoading) {
    return (
      <StudioPanel>
        <PageLoading label={t('loading.loadingUserDetails')} />
      </StudioPanel>
    );
  }

  if (!detail) {
    return (
      <StudioPanel className="flex min-h-72 items-center justify-center">
        <PageError
          title={t('loadErrors.couldNotLoadThisAccount')}
          description={detailError ?? undefined}
          onRetry={() => setDetailAttempt((n) => n + 1)}
        />
      </StudioPanel>
    );
  }

  return (
    <div className="@container flex flex-col gap-4">
      <StudioPanel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            {publicProfile?.artist.avatarUrl ? (
              <Button
                variant="text"
                size="flexible"
                className="border-border relative size-20 shrink-0 overflow-hidden rounded-xl border p-0 shadow-md"
                aria-label={t(
                  'adminUserEditPanelLabels.viewDisplaynameProfilePicture',
                  { displayName: detail.displayName },
                )}
                onClick={() => setAvatarOpen(true)}
              >
                <MediaArtwork src={publicProfile.artist.avatarUrl} alt="" />
              </Button>
            ) : (
              <span className="bg-primary/15 text-primary-strong flex size-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold">
                {detail.displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold">
                  {detail.displayName}
                </h2>
                <Badge variant="pill" color="purple">
                  {detail.role.charAt(0) + detail.role.slice(1).toLowerCase()}
                </Badge>
                {detail.suspendedAt ? (
                  <Badge variant="pill" color="red">
                    {t('adminUserEdit.suspended')}
                  </Badge>
                ) : null}
              </div>
              <p className="text-foreground-secondary text-sm break-words">
                @{detail.username} · {detail.email}
              </p>
              {publicProfile?.artist.pronouns ? (
                <p className="text-foreground-secondary mt-1 text-xs">
                  {publicProfile.artist.pronouns}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Tooltip content={t('adminUserEdit.messageUser')} side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={t('adminUserEditPanelLabels.messageDisplayname', {
                  displayName: detail.displayName,
                })}
                disabled={busy}
                onClick={() => void openConversation()}
              >
                <MessageSquareIcon size={15} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content={t('adminUserEdit.viewProfile')} side="top">
              <ButtonLink
                to="/u/$username"
                params={{ username: detail.username }}
                size="icon-sm"
                variant="secondary"
                aria-label={t(
                  'adminUserEditPanelLabels.viewDisplaynameSProfile',
                  { displayName: detail.displayName },
                )}
              >
                <ExternalLinkIcon size={15} aria-hidden />
              </ButtonLink>
            </Tooltip>
          </div>
        </div>

        {publicProfile?.artist.bio ? (
          <p className="text-foreground-secondary mt-4 max-w-3xl text-sm whitespace-pre-wrap">
            {publicProfile.artist.bio}
          </p>
        ) : null}

        <dl className="border-border mt-4 grid gap-3 border-t pt-4 text-sm @sm:grid-cols-2 @2xl:grid-cols-4">
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.memberSince')}
            </dt>
            <dd>
              {detail.memberSince ? (
                <ListingDate value={detail.memberSince} />
              ) : (
                'Not a member'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.followers')}
            </dt>
            <dd>
              {publicProfile?.artist.followerCount ?? 'Hidden or unavailable'}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.artistType')}
            </dt>
            <dd>
              {publicProfile?.channel?.artistKind ??
                (detail.channel
                  ? t('adminUserEditPanelStates.artist')
                  : t('adminUserEditPanelStates.listener'))}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.publishedMaterial')}
            </dt>
            <dd>
              {publicProfile
                ? `${publicProfile.tracks.length} tracks · ${publicProfile.releases.length} releases · ${publicProfile.collections.length} collections`
                : 'Loading…'}
            </dd>
          </div>
        </dl>

        <dl className="mt-5 grid gap-3 @sm:grid-cols-2 @2xl:grid-cols-4">
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.engagement')}
            </dt>
            <dd className="font-display mt-1 text-xl font-bold">
              {detail.engagementUnitsYtd}
            </dd>
            <dd className="text-foreground-secondary text-xs">units YTD</dd>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.fanSubscriptions')}
            </dt>
            <dd className="font-display mt-1 text-xl font-bold">
              {detail.fanSubscriptionsAsArtist}
            </dd>
            <dd className="text-foreground-secondary text-xs">active</dd>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.channel')}
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {detail.channel?.state ?? 'No channel'}
            </dd>
            <dd className="text-foreground-secondary text-xs">
              {detail.channel
                ? `${detail.channel.totalLiveHours.toFixed(1)} live hours`
                : 'Listener account'}
            </dd>
            {detail.channel ? (
              <dd className="mt-2">
                <AdminChannelKindControl
                  key={detail.channel.slug}
                  slug={detail.channel.slug}
                  initialKind={detail.channel.channelKind ?? 'ARTIST'}
                />
              </dd>
            ) : null}
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              {t('adminUserEdit.payments')}
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {detail.stripeConnectChargesEnabled
                ? t('adminUserEditPanelStates.chargesEnabled')
                : t('adminUserEditPanelStates.notReady')}
            </dd>
          </div>
        </dl>
      </StudioPanel>

      <div className="grid gap-4 @3xl:grid-cols-2">
        <StudioPanel
          title={t('adminUserEdit.accountDetails')}
          description={t('adminUserEdit.accessMembershipAndGovernanceRoles')}
          action={
            <EditIconButton
              label={t('adminUserEdit.editAccountDetails')}
              editing={accountEditing}
              onClick={() => {
                if (accountEditing) {
                  syncDetail(detail);
                }
                setAccountEditing(!accountEditing);
              }}
            />
          }
        >
          {accountEditing ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void saveUser();
              }}
            >
              <Select
                label={t('adminUserEdit.role')}
                value={editRole}
                onValueChange={(value) => setEditRole(value as AccountRole)}
                options={ROLES.map((value) => ({
                  id: value,
                  label: value.charAt(0) + value.slice(1).toLowerCase(),
                }))}
              />
              <Input
                label={t('adminUserEdit.memberNumber')}
                inputMode="numeric"
                value={editMemberNumber}
                onChange={(event) => setEditMemberNumber(event.target.value)}
                placeholder={t('adminUserEdit.notAssigned')}
              />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{t('adminUserEdit.associationMember')}</span>
                <Toggle
                  label={t('adminUserEdit.associationMember')}
                  checked={editMember}
                  onChange={setEditMember}
                />
              </div>
              <div className="flex justify-end">
                <SaveButton
                  saving={busy}
                  label={t('adminUserEdit.saveAccount')}
                  type="submit"
                />
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-foreground-secondary">
                {t('adminUserEdit.role')}
              </dt>
              <dd>
                {detail.role.charAt(0) + detail.role.slice(1).toLowerCase()}
              </dd>
              <dt className="text-foreground-secondary">
                {t('adminUserEdit.memberNumber')}
              </dt>
              <dd>{detail.memberNumber ?? 'Not assigned'}</dd>
              <dt className="text-foreground-secondary">
                {t('adminUserEdit.associationMember')}
              </dt>
              <dd>
                {detail.isMember
                  ? t('adminUserEditPanelStates.yes')
                  : t('adminUserEditPanelStates.no')}
              </dd>
            </dl>
          )}
        </StudioPanel>

        <StudioPanel
          title={t('adminUserEdit.accountAccess')}
          description={
            detail.suspendedAt ? (
              <>
                {'Suspended '}
                <ListingDate value={detail.suspendedAt} />
                {detail.suspendReason ? ` · ${detail.suspendReason}` : ''}
                {'. Restoring it emails them a sign-in link.'}
              </>
            ) : (
              'Suspension blocks sign-in immediately and is audited. They are emailed your reason, and see it when they try to sign in.'
            )
          }
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void toggleSuspension();
            }}
          >
            {!detail.suspendedAt ? (
              <Textarea
                label={t('adminUserEdit.suspensionReason')}
                tone="secondary"
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder={t('adminUserEdit.requiredBeforeSuspending')}
                submitOnModEnter
              />
            ) : null}
            <Button
              type="submit"
              size="sm"
              variant={detail.suspendedAt ? 'secondary' : 'text'}
              disabled={busy}
              className={
                detail.suspendedAt
                  ? undefined
                  : 'text-accent-red-strong hover:text-accent-red-strong'
              }
            >
              <ShieldAlertIcon size={14} aria-hidden className="mr-1.5" />
              {detail.suspendedAt
                ? t('adminUserEditPanelStates.restoreAccount')
                : t('adminUserEditPanelStates.suspendAccount')}
            </Button>
          </form>
        </StudioPanel>
      </div>

      <div className="grid gap-4 @3xl:grid-cols-2">
        <AdminUserEngagementPanel userId={detail.id} />
        <AdminUserRestrictionsPanel userId={detail.id} />
      </div>

      <AdminUserDeletePanel
        user={detail}
        isSelf={me?.id === detail.id}
        onDeleted={() => onUserDeleted?.(detail.id)}
      />

      {messageOpen ? (
        <StudioPanel
          title={t('adminUserEditPanelLabels.messageDisplayname', {
            displayName: detail.displayName,
          })}
          description={t('adminUserEdit.thisUsesTheSameDirect')}
        >
          <div className="border-border bg-background flex max-h-64 min-h-36 flex-col gap-2 overflow-y-auto rounded-lg border p-3">
            {messages.length === 0 ? (
              <PageEmpty title={t('empties.noMessagesStart')} />
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.isMine
                      ? 'bg-primary ml-auto'
                      : 'bg-background-secondary'
                  }`}
                >
                  <div className="text-[10px] opacity-70">
                    {message.senderDisplayName}
                  </div>
                  {message.body}
                </div>
              ))
            )}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <Input
              enterKeyHint="send"
              aria-label={t('adminUserEditPanelLabels.messageDisplayname', {
                displayName: detail.displayName,
              })}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder={t('adminUserEdit.writeAMessage')}
            />
            <Tooltip content={t('adminUserEdit.sendMessage')} side="top">
              <Button
                size="icon"
                disabled={busy || !messageBody.trim()}
                aria-label={t('adminUserEdit.sendMessage')}
                type="submit"
              >
                <SendIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </form>
        </StudioPanel>
      ) : null}

      {status ? (
        <p className="text-sm" role="status">
          {status}
        </p>
      ) : null}

      {avatarOpen && publicProfile?.artist.avatarUrl ? (
        <ImageLightbox
          images={[{ imageUrl: publicProfile.artist.avatarUrl }]}
          index={0}
          label={`${detail.displayName} profile picture`}
          onClose={() => setAvatarOpen(false)}
        />
      ) : null}
    </div>
  );
}
