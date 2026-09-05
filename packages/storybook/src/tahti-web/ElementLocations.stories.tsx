import type { Meta, StoryObj } from '@storybook/react-vite';

type ElementLocation = {
  element: string;
  kind: 'Component' | 'View' | 'Navigation';
  pages: string;
};

const locations: ElementLocation[] = [
  { element: 'AppShell', kind: 'Component', pages: 'Every route' },
  {
    element: 'AppTopNav',
    kind: 'Navigation',
    pages: 'Every listener and artist route',
  },
  { element: 'MobileChrome', kind: 'Navigation', pages: 'Every mobile route' },
  {
    element: 'SectionTabs',
    kind: 'Navigation',
    pages: 'Admin section sub-pages (icon-tab row below the primary tabs)',
  },
  { element: 'StudioNav', kind: 'Navigation', pages: 'Studio routes' },
  { element: 'AdminNav', kind: 'Navigation', pages: 'Admin routes' },
  { element: 'ChannelChatPanel', kind: 'Component', pages: 'Channel, Chat' },
  { element: 'ChannelControlsWidget', kind: 'Component', pages: 'Channel' },
  {
    element: 'ChannelDesigner',
    kind: 'Component',
    pages: 'Studio → Manage → Channel, channel edit mode, Settings → Channel',
  },
  {
    element: 'ChannelElementEditor',
    kind: 'Component',
    pages: 'Channel designer look panel',
  },
  {
    element: 'ChannelLayersMenu',
    kind: 'Component',
    pages: 'Channel edit mode',
  },
  {
    element: 'ChannelRadioPlaylistPanel',
    kind: 'Component',
    pages: 'Channel → Radio, Studio → Manage → Radio',
  },
  {
    element: 'ChannelRotationEditor',
    kind: 'Component',
    pages: 'Studio → Manage → Radio, channel radio management',
  },
  {
    element: 'ChannelVisualizer',
    kind: 'Component',
    pages: 'Channel, Listen ambient surfaces',
  },
  {
    element: 'BroadcastDetailsFields',
    kind: 'Component',
    pages: 'Studio → Schedule, Studio → Go Live',
  },
  {
    element: 'BroadcastPreflightPanel',
    kind: 'Component',
    pages: 'Studio → Perform → Info',
  },
  {
    element: 'StreamManagerPanel',
    kind: 'Component',
    pages: 'Channel, Studio → Go Live',
  },
  {
    element: 'AdminStreamManagerPanel',
    kind: 'Component',
    pages: 'Admin → Overview, Admin → Streams',
  },
  {
    element: 'StudioSoundsView',
    kind: 'View',
    pages: 'Studio → Music → Sounds, Clips, Files',
  },
  {
    element: 'PlayableTrackTable',
    kind: 'Component',
    pages: 'Listen, Library, Studio → Music',
  },
  {
    element: 'TrackInsightsPanel',
    kind: 'Component',
    pages: 'Studio → Music → Sounds → Insights',
  },
  {
    element: 'TrackEditDialog',
    kind: 'Component',
    pages: 'Studio → Music → Sounds, track detail',
  },
  {
    element: 'TracklistEditor',
    kind: 'Component',
    pages: 'Track editor for DJ mixes',
  },
  { element: 'UploadTrackDialog', kind: 'Component', pages: 'Studio → Upload' },
  {
    element: 'StashFilesPanel',
    kind: 'Component',
    pages: 'Studio → Stash, Sounds → Move to stash',
  },
  {
    element: 'StreamOverlayEditor',
    kind: 'Component',
    pages: 'Studio → Go Live, Settings → Broadcast → Multistream overlay',
  },
  {
    element: 'ImageUploadField',
    kind: 'Component',
    pages:
      'ShowImagePicker, VenueRegisterView, StudioScheduleView, StudioVenuesView, Admin → Disco-widgets, Admin → News',
  },
  {
    element: 'AddToMusicActions',
    kind: 'Component',
    pages: 'Listen, Library, channel and artist track lists',
  },
  {
    element: 'AddToPlaylistPanel',
    kind: 'Component',
    pages: 'Player bar, Listen, Library, Studio track lists',
  },
  { element: 'StudioGoLiveView', kind: 'View', pages: 'Studio → Go Live' },
  { element: 'StudioScheduleView', kind: 'View', pages: 'Studio → Schedule' },
  { element: 'StudioStatsView', kind: 'View', pages: 'Studio → Stats' },
  { element: 'StudioUploadView', kind: 'View', pages: 'Studio → Upload' },
  { element: 'StudioStashView', kind: 'View', pages: 'Studio → Stash' },
  {
    element: 'FanTiersEditor',
    kind: 'Component',
    pages: 'Settings → Money, Audience → Tiers',
  },
  {
    element: 'FanSubscriptionStats',
    kind: 'Component',
    pages: 'Studio → Revenue, Admin finance',
  },
  {
    element: 'ArtistGalleryPanel',
    kind: 'Component',
    pages: 'Settings → Artist → Gallery, artist profile',
  },
  {
    element: 'AudienceVisibilitySection',
    kind: 'Component',
    pages: 'Track editor, collection editor, profile settings',
  },
  {
    element: 'PluginStorePanel',
    kind: 'Component',
    pages: 'Settings → Add-ons',
  },
  {
    element: 'DiscoWidgetsSection',
    kind: 'Component',
    pages: 'Listen, channel, artist profile',
  },
  {
    element: 'DiscoWidgetManagerPanel',
    kind: 'Component',
    pages:
      'Settings → Add-ons (listener scope), Studio → Manage → Channel (artist scope), Listen add-widget dialog',
  },
  {
    element: 'ListenAddonsPanel',
    kind: 'Component',
    pages: 'Settings → Add-ons → Listen, Listen add-widget dialog',
  },
  {
    element: 'ListenWidgetStoreDialog',
    kind: 'Component',
    pages: 'Listen header',
  },
  {
    element: 'AdminDiscoWidgetsView',
    kind: 'View',
    pages:
      'Admin → Disco-widgets — registers/edits/deletes the catalog DiscoWidgetManagerPanel installs from',
  },
  {
    element: 'ChannelView',
    kind: 'View',
    pages:
      'Channel — assembles the eight Channel Designer blocks (hero, actions, archive, chat, about, links, textOverlay, subscribe)',
  },
  {
    element: 'WidgetCard / WidgetTrackRow',
    kind: 'Component',
    pages:
      'Discover — one of seven curated content widgets (see DiscoverWidgetId in discoverStore.ts); unrelated to Disco-widgets/DiscoWidgetsSection despite the name',
  },
  { element: 'ListenerWidgetsSection', kind: 'Component', pages: 'Listen' },
  {
    element: 'ListenerWidgetEmbed',
    kind: 'Component',
    pages: 'Listen add-ons, channel widgets',
  },
  {
    element: 'MulticastConfigureDialog',
    kind: 'Component',
    pages: 'Settings → Add-ons → Multistream, Studio → Go Live',
  },
  {
    element: 'GlobalSearch',
    kind: 'Component',
    pages: 'Top navigation and search route',
  },
  {
    element: 'RightRailPanel',
    kind: 'Component',
    pages: 'Listen, Channel, artist profile',
  },
  { element: 'PageStates', kind: 'Component', pages: 'All data-backed pages' },
  {
    element: 'StudioPanel',
    kind: 'Component',
    pages: 'Studio and Admin surfaces',
  },
  {
    element: 'ViewShell',
    kind: 'Component',
    pages:
      'List-page frame (title + short subtitle) on Listen, Discover, Help, Radio, History, Feed, Favorites, Account, Messages, Status, Studio Home/Sounds/Collections/Playlists/Upload/Schedule/Go Live/Releases/Stats/Shows, Library, Admin Dashboard/Users/Streams/Content/Selects/Status, News, What’s New. Persistent nav stays outside. Remaining Studio/Admin still StudioPageHeader. Plan: docs/todo/viewshell-page-headers.md',
  },
  {
    element: 'PageHeader',
    kind: 'Component',
    pages:
      'Listener list headers until ViewShell lands; then entity/legal only where a cover or back row is still needed',
  },
  {
    element: 'StudioPageHeader',
    kind: 'Component',
    pages: 'Studio and Admin list headers until ViewShell lands; then remove',
  },
  {
    element: 'WaveformCanvas',
    kind: 'Component',
    pages: 'Studio editor and upload',
  },
  { element: 'WaveformMinimap', kind: 'Component', pages: 'Studio editor' },
  { element: 'StemPlayer', kind: 'Component', pages: 'Studio audio editor' },
  {
    element: 'SecurityTotpPanel',
    kind: 'Component',
    pages: 'Settings → Account → Security',
  },
  {
    element: 'ApiTokensPanel',
    kind: 'Component',
    pages: 'Settings → Account → Security',
  },
  {
    element: 'SupportContactForm',
    kind: 'Component',
    pages: 'Help, Settings → Support',
  },
  {
    element: 'HelpHubView / HelpArticleView',
    kind: 'View',
    pages: '/help, /help/$slug',
  },
];

const meta: Meta = {
  title: 'Tahti/Reference/Element locations',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Reference map for the latest tahti-web Storybook catalogue. Every listed element names the live page or route where it appears.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LatestSurfaceMap: Story = {
  render: () => (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Tahti element locations
        </h1>
        <p className="text-foreground-secondary mt-2 max-w-2xl text-sm">
          Use this map to move from an isolated component to the product page
          where listeners, artists, or admins encounter it.
        </p>
        <div className="border-border mt-6 overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-secondary/60 text-foreground-secondary text-xs tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3">Element</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Lives on</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {locations.map((location) => (
                <tr key={location.element}>
                  <th className="px-4 py-3 font-medium">{location.element}</th>
                  <td className="text-foreground-secondary px-4 py-3">
                    {location.kind}
                  </td>
                  <td className="px-4 py-3">{location.pages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
};
