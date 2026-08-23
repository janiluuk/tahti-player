import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Toggle } from '@nuclearplayer/ui';

import {
  checkSlugAvailable,
  setCustomDomain,
  updateChannelSlug,
  verifyCustomDomain,
} from '../../api/channel-design';
import { provisionChannel } from '../../api/channel-provision';
import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../api/studio-extras';
import { ChannelDesigner } from '../../components/ChannelDesigner';
import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'setup' | 'design' | 'radio' | 'profile' | 'domain';

const isTab = (value: string | undefined): value is Tab =>
  ['setup', 'design', 'radio', 'profile', 'domain'].includes(value ?? '');

export function StudioChannelView() {
  const search = useSearch({ strict: false }) as { tab?: string };
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refresh);
  const channel = user?.channel;
  const [tab, setTab] = useState<Tab>(channel ? 'design' : 'setup');
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [tipJarUrl, setTipJarUrl] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [freeSubscriptionsEnabled, setFreeSubscriptionsEnabled] =
    useState(true);
  const [slug, setSlug] = useState(channel?.slug ?? '');
  const [slugNote, setSlugNote] = useState<string | null>(null);
  const [domain, setDomain] = useState('');
  const [domainInfo, setDomainInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    void fetchMeProfile().then((r) => {
      setProfile(r.data);
      setDisplayName(r.data.displayName);
      setBio(r.data.bio ?? '');
      setTipJarUrl(r.data.tipJarUrl ?? '');
      setPronouns(r.data.pronouns ?? '');
      setChatEnabled(r.data.chatEnabled);
      setFreeSubscriptionsEnabled(r.data.freeSubscriptionsEnabled !== false);
      setSlug(channel?.slug ?? r.data.username);
    });
  }, [channel?.slug]);

  useEffect(() => {
    if (isTab(search.tab)) {
      setTab(search.tab);
    } else if (!channel) {
      setTab('setup');
    }
  }, [channel, search.tab]);

  const saveProfile = async () => {
    setBusy(true);
    const result = await patchMeProfile({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      tipJarUrl: tipJarUrl.trim() || null,
      pronouns: pronouns.trim() || null,
      chatEnabled,
      freeSubscriptionsEnabled,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProfile(result.data);
    toast.success('Profile saved.');
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/channel" />
        <StudioPageHeader
          title="Channel design"
          subtitle="Set up your channel, then manage its look, 24/7 radio, profile, and domain."
        />
        {user && (
          <Link
            to="/u/$username"
            params={{ username: user.username }}
            className="text-foreground-secondary -mt-2 text-xs underline-offset-2 hover:underline"
          >
            Open public profile →
          </Link>
        )}

        <nav
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Channel sections"
        >
          {(
            [
              { id: 'setup' as const, label: 'Setup' },
              { id: 'design' as const, label: 'Design' },
              { id: 'radio' as const, label: '24/7 radio' },
              { id: 'profile' as const, label: 'Profile' },
              { id: 'domain' as const, label: 'Username / domain' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium tracking-wide uppercase ${
                tab === t.id
                  ? 'bg-primary text-foreground shadow-sm'
                  : 'border-border text-foreground-secondary hover:text-foreground border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'setup' && (
          <StudioPanel title="Channel setup">
            {channel ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm">
                  Your channel <strong>@{channel.slug}</strong> is ready.
                </p>
                <Button size="sm" onClick={() => setTab('design')}>
                  Continue to design
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-foreground-secondary text-sm">
                  Create {user?.username ?? 'your-name'}.tahti.live to unlock
                  broadcasting, uploads, and the public channel designer.
                </p>
                {setupError ? (
                  <p className="text-accent-red text-sm" role="alert">
                    {setupError}
                  </p>
                ) : null}
                <Button
                  disabled={setupBusy || !user}
                  onClick={() => {
                    setSetupBusy(true);
                    setSetupError(null);
                    void provisionChannel().then(async (result) => {
                      setSetupBusy(false);
                      if (!result.ok) {
                        setSetupError(result.error);
                        return;
                      }
                      await refresh();
                      setTab('design');
                      toast.success('Channel created.');
                    });
                  }}
                >
                  {setupBusy
                    ? 'Creating…'
                    : `Create ${user?.username ?? 'your-name'}.tahti.live`}
                </Button>
              </div>
            )}
          </StudioPanel>
        )}

        {tab === 'design' && user && (
          <StudioPanel>
            {channel?.slug ? (
              <div className="border-border bg-background mb-4 flex flex-col gap-2 rounded-lg border px-4 py-3 shadow-sm">
                <p className="text-sm">
                  Prefer editing on the live page — drag layers and tune Look
                  there.
                </p>
                <Link
                  to="/channel/$slug"
                  params={{ slug: channel.slug }}
                  search={{ edit: '1' }}
                  className="text-sm font-medium underline-offset-2 hover:underline"
                >
                  Open channel design editor →
                </Link>
              </div>
            ) : null}
            <ChannelDesigner
              displayName={displayName || user.displayName}
              username={user.username}
              channelSlug={channel?.slug}
              avatarUrl={user.avatarUrl}
              bio={bio || profile?.bio}
            />
          </StudioPanel>
        )}

        {tab === 'radio' && <ChannelRadioPlaylistPanel />}

        {tab === 'profile' && (
          <StudioPanel title="Profile">
            <div className="flex flex-col gap-3">
              {!profile ? (
                <p className="text-foreground-secondary text-sm">Loading…</p>
              ) : (
                <>
                  <Input
                    label="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-foreground-secondary text-xs uppercase">
                      Bio
                    </span>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="border-border bg-background rounded-md border px-3 py-2"
                    />
                  </label>
                  <Input
                    label="Pronouns"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                  />
                  <Input
                    label="Tip jar URL"
                    value={tipJarUrl}
                    onChange={(e) => setTipJarUrl(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Toggle
                      checked={chatEnabled}
                      onChange={setChatEnabled}
                      aria-label="Public channel chat enabled"
                    />
                    Public channel chat enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Toggle
                      checked={freeSubscriptionsEnabled}
                      onChange={setFreeSubscriptionsEnabled}
                      aria-label="Allow free subscriptions"
                    />
                    Allow anyone to subscribe for free
                  </label>
                  <Button
                    size="sm"
                    disabled={busy || !displayName.trim()}
                    onClick={() => void saveProfile()}
                  >
                    {busy ? 'Saving…' : 'Save profile'}
                  </Button>
                </>
              )}
            </div>
          </StudioPanel>
        )}

        {tab === 'domain' && (
          <div className="flex flex-col gap-4">
            <StudioPanel title="Username / channel slug">
              <Input
                label="Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void checkSlugAvailable(slug.trim()).then((r) => {
                      setSlugNote(
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
                      if (r.ok) {
                        setSlugNote(null);
                        toast.success(`Renamed to ${r.slug}`);
                      } else {
                        toast.error(r.error);
                      }
                    });
                  }}
                >
                  Rename
                </Button>
              </div>
              {slugNote && (
                <p className="text-foreground-secondary mt-2 text-xs">
                  {slugNote}
                </p>
              )}
            </StudioPanel>

            <StudioPanel title="Custom domain">
              <p className="text-foreground-secondary mb-3 text-xs">
                Requires membership. Current:{' '}
                {channel?.customDomain
                  ? `${channel.customDomain}${channel.customDomainVerified ? ' (verified)' : ' (pending)'}`
                  : 'none'}
              </p>
              <Input
                label="Domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="music.example.com"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    void setCustomDomain(domain.trim()).then((r) => {
                      if (!r.ok) {
                        toast.error(r.error);
                        return;
                      }
                      // Stays inline, not a toast: these are DNS records the
                      // user has to read and copy into their registrar.
                      setDomainInfo(
                        `Add TXT ${r.txtHost} = ${r.txtRecord}, then Verify.`,
                      );
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
                      if (!r.ok) {
                        toast.error(r.error);
                      } else if (r.verified) {
                        toast.success('Domain verified.');
                      } else {
                        toast.warning(
                          'Not verified yet — DNS may still be propagating.',
                        );
                      }
                    });
                  }}
                >
                  Verify DNS
                </Button>
              </div>
              {domainInfo && (
                <p className="text-foreground-secondary mt-2 text-xs">
                  {domainInfo}
                </p>
              )}
            </StudioPanel>
          </div>
        )}
      </div>
    </StudioGate>
  );
}
