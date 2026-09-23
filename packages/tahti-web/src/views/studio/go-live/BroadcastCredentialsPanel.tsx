import {
  ChevronDownIcon,
  ChevronUpIcon,
  HeadphonesIcon,
  RadioIcon,
  VideoIcon,
} from 'lucide-react';

import { Button, Tooltip } from '@tahti-player/ui';

import { ObsPresetButton } from '../../../components/ObsPresetButton';
import { StudioPanel } from '../../../components/StudioPanel';
import { CopyField } from './CopyField';
import type { GoLiveState } from './useGoLiveState';

export function BroadcastCredentialsPanel({ state }: { state: GoLiveState }) {
  const {
    settings,
    credentialsExpanded,
    setCredentialsExpanded,
    ingest,
    setIngest,
    displayName,
    slug,
  } = state;

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
        <CopyField label="Password" value={settings.icecast.password} />
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
              <ObsPresetButton
                channelName={displayName}
                channelSlug={slug}
                server={settings.rtmp.server}
                streamKey={settings.rtmp.streamKey}
              />
            </div>
          ) : null}
        </>
      )}
    </StudioPanel>
  );
}
