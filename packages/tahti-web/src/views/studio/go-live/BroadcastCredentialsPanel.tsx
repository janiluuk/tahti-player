import {
  ChevronDownIcon,
  ChevronUpIcon,
  HeadphonesIcon,
  RadioIcon,
  RotateCcwKeyIcon,
  VideoIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import {
  rotateIcecastPassword,
  rotateRtmpStreamKey,
} from '../../../api/broadcast';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ObsPresetButton } from '../../../components/ObsPresetButton';
import { PageError, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { CopyField } from './CopyField';
import type { GoLiveState } from './useGoLiveState';

type Credential = 'rtmp' | 'icecast';

export function BroadcastCredentialsPanel({ state }: { state: GoLiveState }) {
  const { t } = useTranslation('web');
  const {
    settings,
    setSettings,
    settingsError,
    reload,
    channelState,
    credentialsExpanded,
    setCredentialsExpanded,
    ingest,
    setIngest,
    slug,
  } = state;

  const [pendingRotate, setPendingRotate] = useState<Credential | null>(null);
  const [rotating, setRotating] = useState(false);

  const credentialCopy = (credential: Credential) =>
    credential === 'rtmp'
      ? {
          name: t('studioGoLiveCredentials.streamKeyName'),
          action: t('studioGoLiveCredentials.streamKeyAction'),
          saved: t('studioGoLiveCredentials.streamKeySaved'),
          rotateTitle: t('studioGoLiveCredentials.rotateStreamKeyTitle'),
        }
      : {
          name: t('studioGoLiveCredentials.passwordName'),
          action: t('studioGoLiveCredentials.icecastAction'),
          saved: t('studioGoLiveCredentials.icecastSaved'),
          rotateTitle: t('studioGoLiveCredentials.rotateIcecastTitle'),
        };

  const rotate = async (credential: Credential) => {
    setPendingRotate(null);
    setRotating(true);
    const result =
      credential === 'rtmp'
        ? await rotateRtmpStreamKey()
        : await rotateIcecastPassword();
    setRotating(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSettings((current) =>
      current
        ? 'streamKey' in result
          ? {
              ...current,
              rtmp: { ...current.rtmp, streamKey: result.streamKey },
            }
          : {
              ...current,
              icecast: { ...current.icecast, password: result.password },
            }
        : current,
    );
    toast.success(credentialCopy(credential).saved);
  };

  const rotateButton = (credential: Credential) => (
    <Tooltip content={credentialCopy(credential).action}>
      <Button
        size="icon-sm"
        variant="secondary"
        disabled={rotating}
        aria-label={credentialCopy(credential).action}
        onClick={() => setPendingRotate(credential)}
      >
        <RotateCcwKeyIcon size={14} aria-hidden />
      </Button>
    </Tooltip>
  );

  const renderCredentials = () => {
    if (!settings && settingsError) {
      return (
        <PageError
          title={t('loadErrors.couldNotLoadYourStreamSettings')}
          description={settingsError}
          onRetry={() => void reload()}
        />
      );
    }
    if (!settings) {
      return <PageLoading label={t('loading.loadingStreamSettings')} />;
    }
    if (ingest === 'obs') {
      return (
        <div className="flex flex-col gap-2">
          <CopyField
            label={t('broadcastCredentials.server')}
            value={settings.rtmp.server}
          />
          <CopyField
            label={t('broadcastCredentials.streamKey')}
            value={settings.rtmp.streamKey}
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <CopyField
          label={t('broadcastCredentials.server')}
          value={settings.icecast.server}
        />
        <CopyField
          label={t('broadcastCredentials.mount')}
          value={settings.icecast.mount}
        />
        <CopyField
          label={t('broadcastCredentials.password')}
          value={settings.icecast.password}
          action={rotateButton('icecast')}
        />
      </div>
    );
  };

  return (
    <StudioPanel
      title={t('broadcastCredentials.connectBroadcastingSoftware')}
      action={
        <Tooltip
          content={
            credentialsExpanded
              ? 'Hide broadcasting options'
              : 'Show broadcasting options'
          }
        >
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => setCredentialsExpanded((current) => !current)}
            aria-label={
              credentialsExpanded
                ? 'Hide broadcasting options'
                : 'Show broadcasting options'
            }
            aria-expanded={credentialsExpanded}
          >
            {credentialsExpanded ? (
              <ChevronUpIcon size={16} aria-hidden />
            ) : (
              <ChevronDownIcon size={16} aria-hidden />
            )}
          </Button>
        </Tooltip>
      }
    >
      {settings && (
        <div className="flex flex-col gap-2">
          <CopyField
            label={t('broadcastCredentials.server')}
            value={settings.rtmp.server}
          />
          <CopyField
            label={t('broadcastCredentials.streamKey')}
            value={settings.rtmp.streamKey}
            maskable
            action={rotateButton('rtmp')}
          />
        </div>
      )}
      {credentialsExpanded && (
        <>
          <div className="mt-4 mb-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={ingest === 'obs' ? 'default' : 'secondary'}
              onClick={() => setIngest('obs')}
            >
              <VideoIcon size={14} aria-hidden className="mr-1.5" />
              OBS
            </Button>
            <Button
              size="sm"
              variant={ingest === 'traktor' ? 'default' : 'secondary'}
              onClick={() => setIngest('traktor')}
            >
              <HeadphonesIcon size={14} aria-hidden className="mr-1.5" />
              Traktor
            </Button>
            <Button
              size="sm"
              variant={ingest === 'icecast' ? 'default' : 'secondary'}
              onClick={() => setIngest('icecast')}
            >
              <RadioIcon size={14} aria-hidden className="mr-1.5" />
              Icecast
            </Button>
          </div>
          {renderCredentials()}
          {ingest === 'obs' && settings && slug ? (
            <div className="border-border bg-background-secondary/40 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <p className="text-sm font-semibold">
                {t('broadcastCredentials.readyMadeObsSetup')}
              </p>
              <ObsPresetButton />
            </div>
          ) : null}
        </>
      )}
      <ConfirmDialog
        isOpen={pendingRotate !== null}
        destructive
        title={
          pendingRotate
            ? credentialCopy(pendingRotate).rotateTitle
            : t('studioGoLiveCredentials.rotateKeyTitle')
        }
        description={
          channelState === 'LIVE'
            ? t('studioGoLiveCredentials.rotateLiveDescription', {
                name: pendingRotate
                  ? credentialCopy(pendingRotate).name
                  : t('studioGoLiveCredentials.streamKeyName'),
              })
            : t('studioGoLiveCredentials.rotateOfflineDescription', {
                name: pendingRotate
                  ? credentialCopy(pendingRotate).name
                  : t('studioGoLiveCredentials.streamKeyName'),
              })
        }
        confirmLabel={t('studioGoLiveCredentials.rotateConfirm')}
        onCancel={() => setPendingRotate(null)}
        onConfirm={() => {
          if (pendingRotate) {
            void rotate(pendingRotate);
          }
        }}
      />
    </StudioPanel>
  );
}
