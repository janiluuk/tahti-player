import { Link } from '@tanstack/react-router';
import {
  ExternalLinkIcon,
  MessageSquareIcon,
  SendIcon,
  ShieldAlertIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Input,
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
import { ImageLightbox } from './ImageLightbox';
import { PageLoading } from './PageStates';
import { StudioPanel } from './StudioPanel';

const ROLES = ['BOARD', 'ARTIST', 'LISTENER'] as const;

/** The user identity/role/membership/suspension editor Admin → Users uses
 * for its selected-user detail column — extracted so any other admin
 * surface (e.g. Admin → Storage's file list) can open the exact same
 * editor for a user by id, instead of a second, drifting implementation. */
export function AdminUserEditPanel({
  userId,
  onUserUpdated,
}: {
  userId: string;
  onUserUpdated?: (user: AdminUserDetail) => void;
}) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editRole, setEditRole] = useState<AccountRole>('LISTENER');
  const [editMember, setEditMember] = useState(false);
  const [editMemberNumber, setEditMemberNumber] = useState('');
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

  const syncDetail = (user: AdminUserDetail) => {
    setDetail(user);
    setEditRole(user.role);
    setEditMember(user.isMember);
    setEditMemberNumber(user.memberNumber?.toString() ?? '');
    onUserUpdated?.(user);
  };

  useEffect(() => {
    setStatus(null);
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
      setDetailLoading(false);
    });
  }, [userId]);

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
      result.data.suspendedAt ? 'Account suspended.' : 'Account restored.',
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
        <PageLoading label="Loading user details…" />
      </StudioPanel>
    );
  }

  if (!detail) {
    return (
      <StudioPanel className="flex min-h-72 items-center justify-center">
        <div className="text-center">
          <UserRoundIcon
            size={28}
            aria-hidden
            className="text-foreground-secondary mx-auto mb-2"
          />
          <p className="text-foreground-secondary text-sm">
            Could not load this account.
          </p>
        </div>
      </StudioPanel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StudioPanel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            {publicProfile?.artist.avatarUrl ? (
              <button
                type="button"
                className="border-border size-20 shrink-0 overflow-hidden rounded-xl border shadow-md"
                aria-label={`View ${detail.displayName} profile picture`}
                onClick={() => setAvatarOpen(true)}
              >
                <img
                  src={publicProfile.artist.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            ) : (
              <span className="bg-primary/15 text-primary flex size-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold">
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
                    Suspended
                  </Badge>
                ) : null}
              </div>
              <p className="text-foreground-secondary text-sm">
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
            <Tooltip content="Message user" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={`Message ${detail.displayName}`}
                disabled={busy}
                onClick={() => void openConversation()}
              >
                <MessageSquareIcon size={15} aria-hidden />
              </Button>
            </Tooltip>
            <Link to="/u/$username" params={{ username: detail.username }}>
              <Tooltip content="View profile" side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label={`View ${detail.displayName}'s profile`}
                >
                  <ExternalLinkIcon size={15} aria-hidden />
                </Button>
              </Tooltip>
            </Link>
          </div>
        </div>

        {publicProfile?.artist.bio ? (
          <p className="text-foreground-secondary mt-4 max-w-3xl text-sm whitespace-pre-wrap">
            {publicProfile.artist.bio}
          </p>
        ) : null}

        <dl className="border-border mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              Member since
            </dt>
            <dd>
              {detail.memberSince
                ? new Date(detail.memberSince).toLocaleDateString()
                : 'Not a member'}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              Followers
            </dt>
            <dd>
              {publicProfile?.artist.followerCount ?? 'Hidden or unavailable'}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              Artist type
            </dt>
            <dd>
              {publicProfile?.channel?.artistKind ??
                (detail.channel ? 'Artist' : 'Listener')}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-secondary text-xs uppercase">
              Published material
            </dt>
            <dd>
              {publicProfile
                ? `${publicProfile.tracks.length} tracks · ${publicProfile.releases.length} releases · ${publicProfile.collections.length} collections`
                : 'Loading…'}
            </dd>
          </div>
        </dl>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              Engagement
            </dt>
            <dd className="font-display mt-1 text-xl font-bold">
              {detail.engagementUnitsYtd}
            </dd>
            <dd className="text-foreground-secondary text-xs">units YTD</dd>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              Fan subscriptions
            </dt>
            <dd className="font-display mt-1 text-xl font-bold">
              {detail.fanSubscriptionsAsArtist}
            </dd>
            <dd className="text-foreground-secondary text-xs">active</dd>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              Channel
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {detail.channel?.state ?? 'No channel'}
            </dd>
            <dd className="text-foreground-secondary text-xs">
              {detail.channel
                ? `${detail.channel.totalLiveHours.toFixed(1)} live hours`
                : 'Listener account'}
            </dd>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <dt className="text-foreground-secondary text-xs uppercase">
              Payments
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {detail.stripeConnectChargesEnabled
                ? 'Charges enabled'
                : 'Not ready'}
            </dd>
          </div>
        </dl>
      </StudioPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <StudioPanel
          title="Account details"
          description="Edit access, membership, and governance roles."
        >
          <div className="flex flex-col gap-3">
            <Select
              label="Role"
              value={editRole}
              onValueChange={(value) => setEditRole(value as AccountRole)}
              options={ROLES.map((value) => ({
                id: value,
                label: value.charAt(0) + value.slice(1).toLowerCase(),
              }))}
            />
            <Input
              label="Member number"
              inputMode="numeric"
              value={editMemberNumber}
              onChange={(event) => setEditMemberNumber(event.target.value)}
              placeholder="Not assigned"
            />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Association member</span>
              <Toggle
                label="Association member"
                checked={editMember}
                onChange={setEditMember}
              />
            </div>
            <div className="flex justify-end">
              <SaveButton
                saving={busy}
                label="Save account"
                onClick={() => void saveUser()}
              />
            </div>
          </div>
        </StudioPanel>

        <StudioPanel
          title="Account access"
          description={
            detail.suspendedAt
              ? `Suspended ${new Date(detail.suspendedAt).toLocaleString()}${
                  detail.suspendReason ? ` · ${detail.suspendReason}` : ''
                }`
              : 'Suspension blocks sign-in immediately and is audited.'
          }
        >
          {!detail.suspendedAt ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-secondary text-xs uppercase">
                Suspension reason
              </span>
              <Textarea
                tone="secondary"
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Required before suspending"
              />
            </label>
          ) : null}
          <Button
            size="sm"
            variant={detail.suspendedAt ? 'secondary' : 'text'}
            disabled={busy}
            className={
              detail.suspendedAt
                ? 'mt-3'
                : 'text-accent-red-strong hover:text-accent-red-strong mt-3'
            }
            onClick={() => void toggleSuspension()}
          >
            <ShieldAlertIcon size={14} aria-hidden className="mr-1.5" />
            {detail.suspendedAt ? 'Restore account' : 'Suspend account'}
          </Button>
        </StudioPanel>
      </div>

      {messageOpen ? (
        <StudioPanel
          title={`Message ${detail.displayName}`}
          description="This uses the same direct-message thread the user sees in Messages."
        >
          <div className="border-border bg-background flex max-h-64 min-h-36 flex-col gap-2 overflow-y-auto rounded-lg border p-3">
            {messages.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No messages yet. Start the conversation below.
              </p>
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
          <div className="mt-3 flex gap-2">
            <Input
              aria-label={`Message ${detail.displayName}`}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="Write a message…"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <Tooltip content="Send message" side="top">
              <Button
                size="icon"
                disabled={busy || !messageBody.trim()}
                aria-label="Send message"
                onClick={() => void sendMessage()}
              >
                <SendIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </div>
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
