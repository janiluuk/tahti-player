import { Link } from '@tanstack/react-router';
import { CalendarIcon, RadioIcon } from 'lucide-react';

import { Badge, Button, EmptyState, ViewShell } from '@tahti-player/ui';

import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { useStripeConfigured } from '../../hooks/useStripeConfigured';
import { accountRoleLabel, getAccountRole } from '../../lib/accountRoles';
import { GovernanceSection } from './home/GovernanceSection';
import { CompactBroadcastTile, Group } from './home/HomeTiles';
import { MusicAudienceGrids } from './home/MusicAudienceGrids';
import { RecentBroadcastRow } from './home/RecentBroadcastRow';
import { SummaryStatsSection } from './home/SummaryStatsSection';
import { UpcomingShowsSection } from './home/UpcomingShowsSection';
import { useStudioHome } from './home/useStudioHome';

export function StudioHomeView() {
  const stripeConfigured = useStripeConfigured();
  const state = useStudioHome();
  const { user, openChannelSetup, channel, recentBroadcasts } = state;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-8">
        <StudioNav current="/studio" />

        <ViewShell title="Studio" classes={{ root: 'px-0 pt-0' }}>
          {user ? (
            <div
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
            <div className="flex flex-col gap-8">
              <SummaryStatsSection state={state} />

              <Group title="Broadcast">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CompactBroadcastTile
                    to="/studio/go-live"
                    icon={RadioIcon}
                    label="Broadcast"
                    subtitle="Keys, signal, on-air"
                    color="var(--accent-red)"
                  />
                  <CompactBroadcastTile
                    to="/studio/schedule"
                    icon={CalendarIcon}
                    label="Schedule"
                    subtitle="Next show & programme"
                    color="var(--accent-blue)"
                  />
                </div>
              </Group>
              <Group title="Recent broadcasts">
                {recentBroadcasts.length === 0 ? (
                  <EmptyState
                    size="sm"
                    className="border-border rounded-xl border"
                    title="No broadcasts yet"
                    description="Completed recordings will appear here."
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
              <MusicAudienceGrids
                state={state}
                stripeConfigured={stripeConfigured}
              />
            </div>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
