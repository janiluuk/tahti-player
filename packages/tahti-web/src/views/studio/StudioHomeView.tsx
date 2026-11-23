import { Link } from '@tanstack/react-router';
import { PlusIcon, RadioIcon, UploadCloudIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ButtonLink, ViewShell } from '@tahti-player/ui';

import { PageEmpty, PageError } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { accountRoleLabel, getAccountRole } from '../../lib/accountRoles';
import { EmptyDiscographyPrompt } from './home/EmptyDiscographyPrompt';
import { Group, HomeTileStagger } from './home/HomeTiles';
import { MusicAudienceGrids } from './home/MusicAudienceGrids';
import { RecentActivitySection } from './home/RecentActivitySection';
import { RecentBroadcastRow } from './home/RecentBroadcastRow';
import { UpcomingShowsSection } from './home/UpcomingShowsSection';
import { useStudioHome } from './home/useStudioHome';

export function StudioHomeView() {
  const { t } = useTranslation('web');
  const state = useStudioHome();
  const {
    user,
    openChannelSetup,
    channel,
    recentBroadcasts,
    broadcastsError,
    reloadOverview,
    hasEmptyDiscography,
  } = state;
  const showBroadcasts =
    recentBroadcasts.length > 0 ||
    Boolean(broadcastsError) ||
    !hasEmptyDiscography;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex min-w-0 flex-col gap-6">
        <ViewShell
          title={t('studioHomeView.studio')}
          classes={{ root: '@container px-0 pt-0', content: 'gap-6' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {user ? (
              <div
                role="group"
                aria-label={t('studioHomeView.accountStatus')}
                className="flex flex-wrap items-center gap-2"
              >
                <Badge variant="pill" color="purple">
                  {accountRoleLabel(getAccountRole(user))}
                </Badge>
                <Badge
                  variant="pill"
                  color={user.isMember ? 'green' : 'secondary'}
                >
                  {user.isMember
                    ? t('studioHomeViewStates.member')
                    : t('studioHomeViewStates.communityAccount')}
                </Badge>
              </div>
            ) : null}
            {channel ? (
              <div className="flex flex-wrap gap-2">
                <ButtonLink to="/studio/upload" size="sm">
                  <UploadCloudIcon size={16} aria-hidden className="mr-2" />
                  {t('studioHomeGrid.upload')}
                </ButtonLink>
                <ButtonLink
                  to="/studio/releases"
                  search={{ create: true }}
                  size="sm"
                  variant="tertiary"
                >
                  <PlusIcon size={16} aria-hidden className="mr-2" />
                  {t('librarySmartLinksView.createRelease')}
                </ButtonLink>
                <ButtonLink to="/studio/go-live" size="sm" variant="tertiary">
                  <RadioIcon size={16} aria-hidden className="mr-2" />
                  {t('studioHub.goLive')}
                </ButtonLink>
              </div>
            ) : null}
          </div>
          {!channel ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-foreground-secondary text-sm">
                {t('studioHomeView.createChannelToUnlock')}
              </p>
              <Button type="button" size="sm" onClick={openChannelSetup}>
                {t('studioHomeView.createYourChannel')}
              </Button>
            </div>
          ) : null}

          {!channel ? null : (
            <HomeTileStagger>
              <EmptyDiscographyPrompt state={state} />
              <UpcomingShowsSection state={state} />
              <div className="grid min-w-0 items-start gap-6 @4xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
                <div className="flex min-w-0 flex-col gap-6">
                  <RecentActivitySection />
                  {showBroadcasts ? (
                    <Group title={t('studioHub.recentBroadcasts')}>
                      {broadcastsError && recentBroadcasts.length === 0 ? (
                        <PageError
                          title={t('studioHub.broadcastsLoadError')}
                          description={broadcastsError}
                          onRetry={reloadOverview}
                        />
                      ) : recentBroadcasts.length === 0 ? (
                        <PageEmpty
                          className="border-border rounded-xl border"
                          title={t('studioHub.noBroadcastsTitle')}
                          description={t('studioHub.noBroadcastsDescription')}
                          action={
                            <ButtonLink to="/studio/go-live">
                              {t('studioHub.goLive')}
                            </ButtonLink>
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
                              to="/studio/recordings"
                              className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
                            >
                              {t('studioHub.viewAllRecordings')}
                            </Link>
                          </div>
                        </div>
                      )}
                    </Group>
                  ) : null}
                </div>
                <MusicAudienceGrids />
              </div>
            </HomeTileStagger>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
