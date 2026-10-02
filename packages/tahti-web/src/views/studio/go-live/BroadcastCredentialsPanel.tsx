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

import { Button, Tooltip } from '@tahti-player/ui';

import {
  rotateIcecastPassword,
  rotateRtmpStreamKey,
} from '../../../api/broadcast';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ObsPresetButton } from '../../../components/ObsPresetButton';
import { StudioPanel } from '../../../components/StudioPanel';
import { CopyField } from './CopyField';
import type { GoLiveState } from './useGoLiveState';

type Credential = 'rtmp' | 'icecast';

const CREDENTIAL_COPY: Record<
  Credential,
  { name: string; action: string; saved: string }
> = {
  rtmp: {
    name: 'stream key',
    action: 'Make a new stream key',
    saved: 'New stream key ready. Paste it into your broadcasting software.',
  },
  icecast: {
    name: 'password',
    action: 'Make a new Icecast password',
    saved: 'New Icecast password ready. Paste it into your DJ software.',
  },
};

export function BroadcastCredentialsPanel({ state }: { state: GoLiveState }) {
  const {
    settings,
    setSettings,
    channelState,
    credentialsExpanded,
    setCredentialsExpanded,
    ingest,
    setIngest,
    slug,
  } = state;

  const [pendingRotate, setPendingRotate] = useState<Credential | null>(null);
  const [rotating, setRotating] = useState(false);

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
    toast.success(CREDENTIAL_COPY[credential].saved);
  };

  const rotateButton = (credential: Credential) => (
    <Tooltip content={CREDENTIAL_COPY[credential].action}>
      <Button
        size="icon-sm"
        variant="secondary"
        disabled={rotating}
        aria-label={CREDENTIAL_COPY[credential].action}
        onClick={() => setPendingRotate(credential)}
      >
        <RotateCcwKeyIcon size={14} aria-hidden />
      </Button>
    </Tooltip>
  );

  const renderCredentials = () => {
    if (!settings) {
      return (
        <p className="text-foreground-secondary text-sm">
          Stream settings could not be loaded.
        </p>
      );
    }
    if (ingest === 'obs') {
      return (
        <div className="flex flex-col gap-2">
          <CopyField label="Server" value={settings.rtmp.server} />
          <CopyField label="Stream key" value={settings.rtmp.streamKey} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <CopyField label="Server" value={settings.icecast.server} />
        <CopyField label="Mount" value={settings.icecast.mount} />
        <CopyField
          label="Password"
          value={settings.icecast.password}
          action={rotateButton('icecast')}
        />
      </div>
    );
  };

  return (
    <StudioPanel
      title="Connect broadcasting software"
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
          <CopyField label="Server" value={settings.rtmp.server} />
          <CopyField
            label="Stream key"
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
              <p className="text-sm font-semibold">Ready-made OBS setup</p>
              <ObsPresetButton />
            </div>
          ) : null}
        </>
      )}
      <ConfirmDialog
        isOpen={pendingRotate !== null}
        title={
          pendingRotate
            ? `${CREDENTIAL_COPY[pendingRotate].action}?`
            : 'Make a new key?'
        }
        description={
          channelState === 'LIVE'
            ? `You're live, so the current ${pendingRotate ? CREDENTIAL_COPY[pendingRotate].name : 'key'} keeps working for 24 hours. Update your software before then.`
            : `The current ${pendingRotate ? CREDENTIAL_COPY[pendingRotate].name : 'key'} stops working right away. Update your software before you next go live.`
        }
        confirmLabel="Make a new one"
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
