import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  InlineError,
  Input,
  SaveButton,
  Toggle,
} from '@tahti-player/ui';

import {
  disconnectSocial,
  patchSocialOAuth,
  socialOAuthStartUrl,
  type SocialAutoPostSettings,
  type SocialOAuthPlatform,
  type SocialPlatformStatus,
} from '../../api/social-autopost';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { webT } from '../../lib/webT';
import { SettingsHint } from './SettingsFields';

export const OAUTH_PLATFORMS: Record<
  SocialOAuthPlatform,
  { name: string; templateMax: number; connectHintKey: ParseKeys<'web'> }
> = {
  twitter: {
    name: 'X / Twitter',
    templateMax: 280,
    connectHintKey: 'socialOAuthPlatformBatch31.connectHintTwitter',
  },
  instagram: {
    name: 'Instagram',
    templateMax: 2200,
    connectHintKey: 'socialOAuthPlatformBatch31.connectHintInstagram',
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
  const { t } = useTranslation('web');
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
      toast.success(
        t('socialOAuthPlatformBatch31.settingsSaved', { name: copy.name }),
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
      toast.success(
        t('socialOAuthPlatformBatch31.disconnected', { name: copy.name }),
      );
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
        <Badge variant="pill" color={status.connected ? 'green' : 'secondary'}>
          {status.connected
            ? webT()('templateText.connectedAs', {
                name: status.accountLabel ?? copy.name,
              })
            : t('socialOAuthPlatformBatch31.notConnected')}
        </Badge>
      </div>
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {status.connected ? (
          <>
            <div className="flex flex-wrap gap-4">
              <Toggle
                label={t('socialOAuth.postNewReleases')}
                checked={onRelease}
                onChange={setOnRelease}
              />
              <Toggle
                label={t('socialOAuth.postWhenIGoLive')}
                checked={onLive}
                onChange={setOnLive}
              />
            </div>
            <Input
              label={t('socialOAuth.postText')}
              help={`${t('socialOAuthPlatformBatch31.templateFields', {
                artist: '{artist}',
                release: '{release}',
                smartLink: '{smart_link}',
                channelUrl: '{channel_url}',
              })}${
                platform === 'instagram'
                  ? ` ${t('socialOAuthPlatformBatch31.instagramImageHint')}`
                  : ''
              }`}
              value={template}
              maxLength={copy.templateMax}
              onChange={(event) => setTemplate(event.target.value)}
            />
          </>
        ) : (
          <SettingsHint>{t(copy.connectHintKey)}</SettingsHint>
        )}
        {error ? <InlineError>{error}</InlineError> : null}
        <div className="flex flex-wrap justify-end gap-2">
          {status.connected ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                intent="danger"
                onClick={() => setConfirmDisconnect(true)}
              >
                {t('socialOAuth.disconnect')}
              </Button>
              <SaveButton
                label={t('socialOAuth.save')}
                saving={saving}
                disabled={saving}
                type="submit"
              />
            </>
          ) : status.configured ? (
            <Button
              size="sm"
              onClick={() =>
                window.location.assign(socialOAuthStartUrl(platform))
              }
            >
              {t('socialOAuthPlatformBatch31.connectName', { name: copy.name })}
            </Button>
          ) : null}
        </div>
      </form>
      <ConfirmDialog
        destructive
        isOpen={confirmDisconnect}
        title={t('socialOAuthPlatformLabels.disconnectName', {
          name: copy.name,
        })}
        description={t('socialOAuth.tahtiForgetsTheSavedSign')}
        confirmLabel={t('socialOAuth.disconnect')}
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={disconnect}
      />
    </section>
  );
}
