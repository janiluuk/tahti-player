import {
  BarcodeIcon,
  BookOpenIcon,
  Disc3Icon,
  LinkIcon,
  Music2Icon,
} from 'lucide-react';

import { type SelectableTile } from '@tahti-player/ui';

export const MUSICBRAINZ_SUBMIT_URL = 'https://musicbrainz.org/release/add';
export const DISCOGS_SUBMIT_URL = 'https://www.discogs.com/search/';

export const MUSICBRAINZ_GUIDE_STEPS = [
  'Export JSON (or copy UPC, ISRC, credits, P/C-lines).',
  'Open MusicBrainz “Add release” and choose the release type.',
  'Enter title, artist credit, and date — match your Tahti release.',
  'Add medium and tracklist; paste ISRCs from your export when you have them.',
  'Add label, catalog number, and barcode if applicable.',
  'Save, then copy the release MBID back into Tahti.',
] as const;

export const DISCOGS_GUIDE_STEPS = [
  'Export JSON (or copy title, label, barcode, and credits).',
  'Search Discogs first — only add if the release is missing.',
  'Submit a new release with title, label, format, country, and date.',
  'Add the tracklist in order with durations from your export.',
  'Add barcode and catalog number if applicable, then submit for review.',
  'Copy the release URL or numeric ID back into Tahti.',
] as const;

export const CATALOG_METHODS = [
  {
    id: 'upc',
    label: 'UPC / EAN',
    description: 'Identify the release with its barcode.',
    icon: BarcodeIcon,
  },
  {
    id: 'musicbrainz',
    label: 'MusicBrainz',
    description: 'Link the open catalog release and artist records.',
    icon: Music2Icon,
  },
  {
    id: 'discogs',
    label: 'Discogs',
    description: 'Link the community catalog release entry.',
    icon: Disc3Icon,
  },
  {
    id: 'rights',
    label: 'Rights & label',
    description: 'Store P-line, C-line, and label imprint details.',
    icon: BookOpenIcon,
  },
] as const;

export const CATALOG_METHOD_TILES: SelectableTile[] = CATALOG_METHODS.map(
  (method) => ({
    id: method.id,
    label: method.label,
    description: method.description,
    icon: <method.icon size={18} aria-hidden />,
  }),
);

export const GUIDE_TILES: SelectableTile[] = [
  {
    id: 'musicbrainz',
    label: 'MusicBrainz',
    icon: <Music2Icon size={28} aria-hidden />,
  },
  {
    id: 'discogs',
    label: 'Discogs',
    icon: <Disc3Icon size={28} aria-hidden />,
  },
  {
    id: 'upc',
    label: 'UPC / EAN',
    icon: <BarcodeIcon size={28} aria-hidden />,
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: <LinkIcon size={28} aria-hidden />,
  },
];

export const POST_RELEASE_CLAIM_LINKS = [
  {
    id: 'spotify',
    label: 'Spotify for Artists',
    url: 'https://artists.spotify.com/',
  },
  {
    id: 'apple',
    label: 'Apple Music for Artists',
    url: 'https://artists.apple.com/',
  },
  {
    id: 'youtube',
    label: 'YouTube Official Artist Channel',
    url: 'https://www.youtube.com/artist',
  },
] as const;

export const COLLECTING_SOCIETY_POINTERS = [
  {
    id: 'teosto',
    region: 'Finland',
    label: 'Teosto',
    url: 'https://www.teosto.fi/en/',
    hint: 'Works and performers for public performance royalties.',
  },
  {
    id: 'gramex',
    region: 'Finland',
    label: 'Gramex',
    url: 'https://www.gramex.fi/en/',
    hint: 'Neighbouring rights for recordings.',
  },
  {
    id: 'prs',
    region: 'UK',
    label: 'PRS for Music',
    url: 'https://www.prsformusic.com/',
    hint: 'UK composition performance rights.',
  },
  {
    id: 'ascap',
    region: 'USA',
    label: 'ASCAP',
    url: 'https://www.ascap.com/',
    hint: 'US PRO for songwriters and publishers.',
  },
] as const;
