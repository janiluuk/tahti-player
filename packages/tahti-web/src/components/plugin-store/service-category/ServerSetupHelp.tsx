import { UploadIcon } from 'lucide-react';
import { useContext } from 'react';

import { ButtonLink, CopyButton, ExternalLink } from '@tahti-player/ui';

import { apiBase } from '../../../api/http';
import type { IntegrationId } from '../../../api/sources';
import { hasAccountRole } from '../../../lib/accountRoles';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { ConfigureDialogHost } from '../shared';

const SERVER_SETUP: Partial<
  Record<IntegrationId, { envPrefix: string; portal: string }>
> = {
  soundcloud: {
    envPrefix: 'SOUNDCLOUD',
    portal: 'https://soundcloud.com/you/apps',
  },
  bandcamp: {
    envPrefix: 'BANDCAMP',
    portal: 'https://bandcamp.com/developer',
  },
  mixcloud: {
    envPrefix: 'MIXCLOUD',
    portal: 'https://www.mixcloud.com/developers/',
  },
  'google-drive': {
    envPrefix: 'GOOGLE_DRIVE',
    portal: 'https://console.cloud.google.com/apis/credentials',
  },
  musicbrainz: {
    envPrefix: 'MUSICBRAINZ',
    portal: 'https://musicbrainz.org/account/applications',
  },
};

export function ServerSetupHelp({
  integrationId,
  name,
}: {
  integrationId: IntegrationId;
  name: string;
}) {
  const user = useAuthStore((state) => state.user);
  const setup = SERVER_SETUP[integrationId];
  const callbackUrl = `${apiBase() || window.location.origin}/api/me/${integrationId}/oauth/callback`;
  const isBoard = hasAccountRole(user, 'BOARD');
  const host = useContext(ConfigureDialogHost);

  return (
    <div
      className="border-border flex flex-col gap-3 rounded-lg border p-3 text-sm"
      data-testid="server-setup-help"
    >
      <p>
        {name} is not switched on for Tahti yet, so there is nothing to connect
        to. The Tahti team has to register Tahti as a {name} app first.
      </p>
      {isBoard && setup ? (
        <ol className="text-foreground-secondary flex list-decimal flex-col gap-2 pl-5">
          <li>
            Register an app at{' '}
            <ExternalLink href={setup.portal}>{setup.portal}</ExternalLink>.
          </li>
          <li>
            <span>Set its redirect URL to </span>
            <code className="text-foreground break-all">{callbackUrl}</code>
            <CopyButton
              text={callbackUrl}
              size="icon-sm"
              variant="text"
              aria-label="Copy redirect URL"
              className="ml-1 align-middle"
            />
          </li>
          <li>
            Set{' '}
            <code className="text-foreground">{setup.envPrefix}_CLIENT_ID</code>{' '}
            and{' '}
            <code className="text-foreground">
              {setup.envPrefix}_CLIENT_SECRET
            </code>{' '}
            on the API (<code>pnpm tahti-ops env set</code>) and redeploy.
          </li>
        </ol>
      ) : (
        <p className="text-foreground-secondary">
          Until then you can upload the files yourself.
        </p>
      )}
      <ButtonLink
        to="/library/upload"
        size="sm"
        variant="secondary"
        className="gap-1.5 self-start"
        onClick={() => {
          useSettingsModalStore.getState().close();
          host?.onClose();
        }}
      >
        <UploadIcon size={14} aria-hidden />
        Upload files
      </ButtonLink>
    </div>
  );
}
