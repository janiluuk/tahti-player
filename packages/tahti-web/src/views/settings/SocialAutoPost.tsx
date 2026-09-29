import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, SaveButton, Toggle } from '@tahti-player/ui';

import {
  disconnectSocial,
  fetchSocialAutoPost,
  saveBluesky,
  saveMastodon,
  type SocialAutoPostPlatform,
  type SocialAutoPostSettings,
  type SocialPlatformStatus,
} from '../../api/social-autopost';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SettingsHint } from './SettingsFields';
import { SocialPostNow } from './SocialPostNow';

const PLATFORMS: Record<
  SocialAutoPostPlatform,
  {
    name: string;
    accountLabel: string;
    accountPlaceholder: string;
    secretLabel: string;
    templateMax: number;
  }
> = {
  mastodon: {
    name: 'Mastodon',
    accountLabel: 'Instance URL',
    accountPlaceholder: 'https://mastodon.social',
    secretLabel: 'Access token',
    templateMax: 500,
  },
  bluesky: {
    name: 'Bluesky',
    accountLabel: 'Handle',
    accountPlaceholder: 'you.bsky.social',
    secretLabel: 'App password',
    templateMax: 300,
  },
};

function PlatformForm({
  platform,
  status,
  onChanged,
}: {
  platform: SocialAutoPostPlatform;
  status: SocialPlatformStatus;
  onChanged: (settings: SocialAutoPostSettings | null) => void;
}) {
  const copy = PLATFORMS[platform];
  const [account, setAccount] = useState(status.accountLabel ?? '');
  const [secret, setSecret] = useState('');
  const [onRelease, setOnRelease] = useState(status.onReleasePublished);
  const [onLive, setOnLive] = useState(status.onChannelLive);
  const [template, setTemplate] = useState(status.postTemplate);
  const [saving, setSaving] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setSaving(true);
    setError(null);
    const triggers = {
      onReleasePublished: onRelease,
      onChannelLive: onLive,
      postTemplate: template.trim() || undefined,
    };
    const request =
      platform === 'mastodon'
        ? saveMastodon({
            ...triggers,
            instanceUrl: account.trim(),
            accessToken: secret.trim() || undefined,
          })
        : saveBluesky({
            ...triggers,
            handle: account.trim(),
            appPassword: secret.trim() || undefined,
          });
    void request.then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSecret('');
      toast.success(
        status.connected
          ? `${copy.name} settings saved.`
          : `${copy.name} connected.`,
      );
      onChanged(result.data);
    });
  };

  const disconnect = () => {
    setConfirmDisconnect(false);
    void disconnectSocial(platform).then((result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`${copy.name} disconnected.`);
      onChanged(null);
    });
  };

  const canSave =
    account.trim().length > 0 && (status.connected || secret.trim().length > 0);

  return (
    <section
      className="border-border flex flex-col gap-3 rounded-lg border p-4"
      aria-label={copy.name}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{copy.name}</h3>
        <span className="text-foreground-secondary text-xs">
          {status.connected
            ? `Connected as ${status.accountLabel ?? copy.name}`
            : 'Not connected'}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={copy.accountLabel}
          value={account}
          placeholder={copy.accountPlaceholder}
          onChange={(event) => setAccount(event.target.value)}
        />
        <Input
          label={copy.secretLabel}
          type="password"
          autoComplete="off"
          value={secret}
          placeholder={
            status.connected ? 'Leave blank to keep the saved one' : ''
          }
          onChange={(event) => setSecret(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <Toggle
          label="Post new releases"
          checked={onRelease}
          onChange={setOnRelease}
        />
        <Toggle
          label="Post when I go live"
          checked={onLive}
          onChange={setOnLive}
        />
      </div>
      <Input
        label="Post text"
        value={template}
        maxLength={copy.templateMax}
        onChange={(event) => setTemplate(event.target.value)}
      />
      <SettingsHint>
        Fills in {'{artist}'}, {'{release}'}, {'{smart_link}'} and{' '}
        {'{channel_url}'}.{' '}
        {status.connected
          ? ''
          : `Connecting posts a short test message to your ${copy.name} account.`}
      </SettingsHint>
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        {status.connected ? (
          <Button
            size="sm"
            variant="secondary"
            intent="danger"
            onClick={() => setConfirmDisconnect(true)}
          >
            Disconnect
          </Button>
        ) : null}
        <SaveButton
          label={status.connected ? 'Save' : `Connect ${copy.name}`}
          saving={saving}
          disabled={saving || !canSave}
          onClick={save}
        />
      </div>
      <ConfirmDialog
        isOpen={confirmDisconnect}
        title={`Disconnect ${copy.name}?`}
        description="Tahti forgets the saved credentials and stops posting there."
        confirmLabel="Disconnect"
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={disconnect}
      />
    </section>
  );
}

export function SocialAutoPost() {
  const [settings, setSettings] = useState<SocialAutoPostSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0);

  const load = () => {
    void fetchSocialAutoPost().then((result) => {
      setSettings(result.data);
      setLoaded(true);
      setVersion((current) => current + 1);
    });
  };

  useEffect(load, []);

  if (!loaded) {
    return null;
  }
  if (!settings) {
    return (
      <SettingsHint>Auto-posting settings could not be loaded.</SettingsHint>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="social-autopost">
      <div>
        <h3 className="text-sm font-semibold">Auto-post</h3>
        <SettingsHint>
          Post to your own accounts when you publish a release or go live.
        </SettingsHint>
      </div>
      {(['mastodon', 'bluesky'] as const).map((platform) => (
        <PlatformForm
          key={`${platform}-${version}`}
          platform={platform}
          status={settings[platform]}
          onChanged={(next) => {
            if (next) {
              setSettings(next);
              setVersion((current) => current + 1);
            } else {
              load();
            }
          }}
        />
      ))}
      <SocialPostNow settings={settings} />
    </div>
  );
}
