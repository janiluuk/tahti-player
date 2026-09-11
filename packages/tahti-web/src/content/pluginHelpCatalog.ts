export type PluginHelpState = 'ready' | 'partial';

export type PluginHelpEntry = {
  name: string;
  category: string;
  state: PluginHelpState;
  stateLabel: string;
  /** What the add-on does, in plain language. */
  description: string;
  /** How to turn it on and use it. */
  help: string;
};

export const READY_PLUGIN_HELP: PluginHelpEntry[] = [
  {
    name: 'App themes',
    category: 'Themes',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Recolors the whole app, including your public channel, from a curated palette or a JSON theme you import.',
    help: 'Open Settings → Add-ons → Themes to switch palettes or import a custom theme JSON.',
  },
  {
    name: 'Channel visualizers',
    category: 'Visualizers',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Drives an animated backdrop on your channel and the fullscreen player from the currently playing audio.',
    help: 'Pick a live visual in Settings → Add-ons → Visualizers or Studio → Channel. Ten WebGL presets plus Minimal are available while audio is playing.',
  },
  {
    name: 'Local upload',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Uploads audio files straight from your device into your Tahti archive.',
    help: 'Studio → Upload (or Library → Upload) sends audio into your archive.',
  },
  {
    name: 'Soulseek',
    category: 'Import',
    state: 'partial',
    stateLabel: 'Desktop planned',
    description:
      'Search and download from Soulseek into your local library from the desktop player. The browser cannot speak the Soulseek protocol, and Tahti does not relay peer-to-peer traffic.',
    help: 'Settings → Add-ons → Import → Soulseek → Configure. Test connection stays disabled until the native desktop bridge ships. Use Library → Local files for local audio in the meantime.',
  },
  {
    name: 'Stash',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'A private file locker for stems, masters, and works-in-progress that never appear on your public channel.',
    help: 'Studio → Stash holds private stems and masters. Files stay off the public channel until you publish them.',
  },
  {
    name: 'SoundCloud',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Connects your SoundCloud account so you can pull your own downloadable tracks into your Tahti archive.',
    help: 'Connect under Settings → Add-ons → Import or Sources, then browse downloadable tracks and queue a server-side import.',
  },
  {
    name: 'Bandcamp',
    category: 'Import',
    state: 'partial',
    stateLabel: 'Importer ready',
    description:
      'Connects your Bandcamp account to browse your discography and bring albums into your catalog, with in-app playback through the Bandcamp widget once a track is imported.',
    help: 'Connect Bandcamp from Sources, then import albums into your catalog. Imported tracks play through the Bandcamp widget on Tahti. Production catalog import is still pending the sibling API’s Bandcamp import endpoint.',
  },
  {
    name: 'Google Drive',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Pulls audio files out of your Google Drive as cloud-import jobs.',
    help: 'Connect Drive from Sources, then import audio files as cloud-import jobs.',
  },
  {
    name: 'Mixcloud',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Connects Mixcloud so you can rescue existing mixes into your archive or push archive mixes back out to Mixcloud.',
    help: 'Connect Mixcloud from Sources to rescue or upload mixes to and from your archive.',
  },
  {
    name: 'Spotify search',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Searches Spotify’s public catalogue, loads your linked artist catalogue or another artist URL, and adds tracks into mixed-source collections; the Spotify widget plays the real track in-app.',
    help: 'Open a collection and choose Add from Spotify. Search the public catalogue, load your linked artist, or paste another artist URL, then add tracks as Spotify embeds.',
  },
  {
    name: 'hearthis.at search',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Searches hearthis.at’s public catalogue and adds tracks as provider-hosted embeds that play in-app.',
    help: 'Search the public hearthis.at catalogue from Sources and add tracks as provider-hosted embeds.',
  },
  {
    name: 'URL / DSP paste',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Seeds a release smart link’s destination buttons from a pasted streaming-service URL.',
    help: 'Paste Spotify, Bandcamp, or similar URLs when building a release smart link.',
  },
  {
    name: 'Internet radio URL',
    category: 'Import',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Plays any direct stream or M3U/M3U8 playlist URL as a station in the shared Tahti player.',
    help: 'Paste an M3U, M3U8, or direct stream URL in Sources to play a station in the shared player.',
  },
  {
    name: 'YouTube Live',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Mirrors your Tahti broadcast to a YouTube Live stream.',
    help: 'Add a YouTube destination in Settings → Add-ons → Multicast or Studio → Broadcast. Paste the stream key from YouTube Studio.',
  },
  {
    name: 'Twitch',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Mirrors your Tahti broadcast to a Twitch channel.',
    help: 'Add a Twitch destination with your ingest stream key so the live show is mirrored while you broadcast on Tahti.',
  },
  {
    name: 'Facebook Live',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Mirrors your Tahti broadcast to Facebook Live.',
    help: 'Add a Facebook destination and stream key from Facebook Live Producer.',
  },
  {
    name: 'Kick',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Mirrors your Tahti broadcast to Kick.',
    help: 'Add a Kick destination. Supply the ingest address if Kick does not use the default RTMP hint.',
  },
  {
    name: 'TikTok Live',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Mirrors your Tahti broadcast to TikTok LIVE.',
    help: 'Add a TikTok destination using the stream key from TikTok LIVE Center.',
  },
  {
    name: 'Mixcloud Live',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Mirrors your Tahti broadcast to Mixcloud Live.',
    help: 'Add a Mixcloud Live destination with the key from Mixcloud’s live broadcasting settings.',
  },
  {
    name: 'Instagram Live',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Mirrors your Tahti broadcast to Instagram Live.',
    help: 'Add an Instagram destination using the RTMPS ingest and key from Instagram professional live tools.',
  },
  {
    name: 'Custom RTMP',
    category: 'Multicast',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Mirrors your Tahti broadcast to any other encoder or platform that accepts an RTMP ingest.',
    help: 'Choose Custom RTMP and paste both the ingest URL and stream key for any other encoder destination.',
  },
  {
    name: 'AcoustID',
    category: 'Fingerprinting',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Fingerprints a track’s audio and matches it against the AcoustID/MusicBrainz database to fill in catalog metadata.',
    help: 'Open a track in Studio → Music and run fingerprint match or re-check to look up catalog metadata.',
  },
  {
    name: 'EQ',
    category: 'Audio tools',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Multi-band equalizer for shaping tone in the Pro Editor.',
    help: 'Activate it in Settings → Add-ons → Audio tools, then add it to a Pro Editor chain.',
  },
  {
    name: 'Compressor',
    category: 'Audio tools',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Evens out loud and quiet passages before export.',
    help: 'Activate it under Audio tools, then use it in the Pro Editor to even out dynamics before export.',
  },
  {
    name: 'Limiter',
    category: 'Audio tools',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Caps peak loudness so the export doesn’t clip.',
    help: 'Activate it under Audio tools. The editor preview is a fast ceiling; the export render is the final file.',
  },
  {
    name: 'Filter',
    category: 'Audio tools',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Low-pass, high-pass, and shelf filtering with selectable slope for cutting or shaping frequency ranges.',
    help: 'Activate it under Audio tools, then choose low-pass, high-pass, or shelf in the Pro Editor.',
  },
  {
    name: 'Internet radio stations',
    category: 'Radio',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Adds curated internet radio stations as extra options in the main player, alongside Tahti channels.',
    help: 'Enable stations in Settings → Add-ons → Radio. They appear as extra stations in the main player.',
  },
  {
    name: 'SoundCloud embed',
    category: 'Embed',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Puts a playable SoundCloud track, set, or playlist widget on your public Listen page.',
    help: 'Settings → Add-ons → Embed. Paste a SoundCloud track, set, or playlist URL onto your Listen page.',
  },
  {
    name: 'YouTube embed',
    category: 'Embed',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Puts a playable YouTube video or playlist widget on your Listen page.',
    help: 'Settings → Add-ons → Embed. Paste a YouTube video or playlist URL.',
  },
  {
    name: 'Spotify playlist embed',
    category: 'Embed',
    state: 'ready',
    stateLabel: 'Ready',
    description: 'Puts a playable Spotify playlist widget on your Listen page.',
    help: 'Settings → Add-ons → Embed. Paste a public Spotify playlist URL only.',
  },
  {
    name: 'hearthis.at embed',
    category: 'Embed',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Puts a playable hearthis.at track widget on your Listen page.',
    help: 'Settings → Add-ons → Embed. Paste a hearthis.at embed URL or numeric track ID.',
  },
  {
    name: 'Listen-page Disco-widgets',
    category: 'Discovery',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Sandboxed community-built widgets that appear on your own Listen page, visible only to you.',
    help: 'Install sandboxed widgets from Settings → Add-ons → Discovery. Only you see them on Listen. See Help → Contribute a Disco-widget to publish a new one.',
  },
  {
    name: 'Channel Disco-widgets',
    category: 'Channel',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Sandboxed community-built widgets that render on your public channel and artist page for every listener.',
    help: 'Install public widgets from Settings → Add-ons → Channel. Listeners see them on your channel and artist page.',
  },
  {
    name: 'MediaSession',
    category: 'Playback',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'Exposes the shared Tahti player to your headset, lock screen, and OS media keys.',
    help: 'Always on. Headset, lock-screen, and OS media keys control the shared Tahti player. No configuration is required.',
  },
  {
    name: 'ListenBrainz',
    category: 'Scrobbling',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'When a Tahti track counts as a listen, submits it to your ListenBrainz profile. Charts and dashboards are not included.',
    help: 'Settings → Add-ons → Scrobbling → Configure. Paste your ListenBrainz user token, then Save and enable. Eligible signed-in listens are submitted automatically; Disconnect removes the stored token.',
  },
  {
    name: 'Last.fm',
    category: 'Scrobbling',
    state: 'ready',
    stateLabel: 'Ready',
    description:
      'When a Tahti track counts as a listen, submits it to your Last.fm profile. Charts and recommendations are not included.',
    help: 'Settings → Add-ons → Scrobbling → Connect. Approve Tahti on Last.fm; you return here when connected. Disconnect removes the stored session. Requires Last.fm API keys on the server.',
  },
];

export const PLUGIN_HELP_TABLE = {
  columns: ['Name', 'Category', 'State', 'What it does', 'How to use it'],
  rows: READY_PLUGIN_HELP.map((plugin) => [
    plugin.name,
    plugin.category,
    plugin.stateLabel,
    plugin.description,
    plugin.help,
  ]),
};
