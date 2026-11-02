import { Link } from '@tanstack/react-router';

import { Badge, Button, ButtonLink, ViewShell } from '@tahti-player/ui';

import { PageEmpty, PageError } from '../../components/PageStates';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { StudioGate } from '../../components/StudioGate';
import { useStripeConfigured } from '../../hooks/useStripeConfigured';
import { accountRoleLabel, getAccountRole } from '../../lib/accountRoles';
import { EmptyDiscographyPrompt } from './home/EmptyDiscographyPrompt';
import { GovernanceSection } from './home/GovernanceSection';
import { Group, HomeTileStagger } from './home/HomeTiles';
import { MusicAudienceGrids } from './home/MusicAudienceGrids';
import { RecentActivitySection } from './home/RecentActivitySection';
import { RecentBroadcastRow } from './home/RecentBroadcastRow';
import { UpcomingShowsSection } from './home/UpcomingShowsSection';
import { useStudioHome } from './home/useStudioHome';

export function StudioHomeView() {
  const stripeConfigured = useStripeConfigured();
  const state = useStudioHome();
  const {
    user,
    openChannelSetup,
    channel,
    recentBroadcasts,
    broadcastsError,
    reloadOverview,
  } = state;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-8">
        <ViewShell title="Studio" classes={{ root: 'px-0 pt-0' }}>
          {user ? (
            <div
              role="group"
              aria-label="Account status"
              className="mb-4 flex flex-wrap items-center gap-2"
            >
              <Badge variant="pill" color="purple">
                {accountRoleLabel(getAccountRole(user))}
              </Badge>
              <Badge
                variant="pill"
                color={user.isMember ? 'green' : 'secondary'}
              >
                {user.isMember ? 'Member' : 'Community account'}
              </Badge>
            </div>
          ) : null}
          {!channel ? (
            <p className="text-foreground-secondary text-sm">
              <Button
                type="button"
                size="sm"
                variant="text"
                onClick={openChannelSetup}
                className="h-auto p-0 underline underline-offset-2"
              >
                Create your channel
              </Button>{' '}
              to unlock Music and Broadcast.
            </p>
          ) : null}

          {!channel ? null : (
            <HomeTileStagger>
              <MusicAudienceGrids
                state={state}
                stripeConfigured={stripeConfigured}
              />
              <EmptyDiscographyPrompt state={state} />
              <Group title="Stream">
                <StreamManagerPanel
                  slug={channel.slug}
                  channelState={channel.state ?? 'OFFLINE'}
                />
              </Group>
              <RecentActivitySection />
              <Group title="Recent broadcasts">
                {broadcastsError && recentBroadcasts.length === 0 ? (
                  <PageError
                    title="Could not load recent broadcasts"
                    description={broadcastsError}
                    onRetry={reloadOverview}
                  />
                ) : recentBroadcasts.length === 0 ? (
                  <PageEmpty
                    className="border-border rounded-xl border"
                    title="No broadcasts yet"
                    description="Go live when you are ready — finished shows land here as recordings."
                    action={
                      <ButtonLink to="/studio/go-live">Go live</ButtonLink>
                    }
                  />
                ) : (
                  <div className="border-border overflow-hidden rounded-xl border">
                    <ul>
                      {recentBroadcasts.slice(0, 3).map((broadcast) => (
                        <RecentBroadcastRow
                          key={broadcast.id}
                          broadcast={broadcast}
                        />
                      ))}
                    </ul>
                    <div className="border-border border-t px-4 py-3">
                      <Link
                        to="/library/recordings"
                        className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
                      >
                        View all recordings →
                      </Link>
                    </div>
                  </div>
                )}
              </Group>
              <UpcomingShowsSection state={state} />
              <GovernanceSection state={state} />
            </HomeTileStagger>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
