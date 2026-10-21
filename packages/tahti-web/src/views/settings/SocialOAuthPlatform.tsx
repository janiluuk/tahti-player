import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, SaveButton, Toggle } from '@tahti-player/ui';

import {
  disconnectSocial,
  patchSocialOAuth,
  socialOAuthStartUrl,
  type SocialAutoPostSettings,
  type SocialOAuthPlatform,
  type SocialPlatformStatus,
} from '../../api/social-autopost';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SettingsHint } from './SettingsFields';

export const OAUTH_PLATFORMS: Record<
  SocialOAuthPlatform,
  { name: string; templateMax: number; connectHint: string }
> = {
  twitter: {
    name: 'X / Twitter',
    templateMax: 280,
    connectHint:
      'You sign in on X, and connecting posts a short test message to your account.',
  },
  instagram: {
    name: 'Instagram',
    templateMax: 2200,
    connectHint:
      'You sign in with Facebook. Needs an Instagram professional account linked to a Facebook Page.',
  },
};

type OAuthStatus = SocialPlatformStatus & { configured?: boolean };

/** Shown when the platform is configured on the server, or still connected
 * from before it was turned off so the artist can disconnect. */
export function showOAuthPlatform(status: OAuthStatus | undefined): boolean {
  return Boolean(status && (status.configured === true || status.connected));
}

export function SocialOAuthPlatform({
  platform,
  status,
  onChanged,
}: {
  platform: SocialOAuthPlatform;
  status: OAuthStatus;
  onChanged: (settings: SocialAutoPostSettings | null) => void;
}) {
  const copy = OAUTH_PLATFORMS[platform];
  const [onRelease, setOnRelease] = useState(status.onReleasePublished);
  const [onLive, setOnLive] = useState(status.onChannelLive);
  const [template, setTemplate] = useState(status.postTemplate);
  const [saving, setSaving] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setSaving(true);
    setError(null);
    void patchSocialOAuth(platform, {
      onReleasePublished: onRelease,
      onChannelLive: onLive,
      postTemplate: template.trim() || undefined,
    }).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`${copy.name} settings saved.`);
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
      {status.connected ? (
        <>
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
            {'{channel_url}'}.
            {platform === 'instagram'
              ? ' Instagram posts need an image: the release cover, a channel image or your profile picture.'
              : ''}
          </SettingsHint>
        </>
      ) : (
        <SettingsHint>{copy.connectHint}</SettingsHint>
      )}
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        {status.connected ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              intent="danger"
              onClick={() => setConfirmDisconnect(true)}
            >
              Disconnect
            </Button>
            <SaveButton
              label="Save"
              saving={saving}
              disabled={saving}
              onClick={save}
            />
          </>
        ) : status.configured ? (
          <Button
            size="sm"
            onClick={() =>
              window.location.assign(socialOAuthStartUrl(platform))
            }
          >
            Connect {copy.name}
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        isOpen={confirmDisconnect}
        title={`Disconnect ${copy.name}?`}
        description="Tahti forgets the saved sign-in and stops posting there."
        confirmLabel="Disconnect"
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={disconnect}
      />
    </section>
  );
}
