import { type GreenRoomPrefs } from './green-room';
import {
  type ChannelMember,
  type ChatBan,
  type ModeratorRow,
} from './moderation';
import { type DiscoveryPrefs, type NotificationPrefs } from './prefs';
import { type PressKitMeta } from './press-kit';
import { type SocialConnections } from './social';

export let mockNotifications: NotificationPrefs = {
  notifyMoneyMovesEmail: true,
  notifyMoneyMovesInApp: true,
  notifyListenerActivityEmail: true,
  notifyWeeklyRecapEmail: true,
};

export let mockDiscovery: DiscoveryPrefs = {
  listedInDirectory: true,
  allowRadioPickup: true,
  showOnListenHome: true,
  genreTags: 'ambient, live',
  showFavorites: true,
  announceReleases: true,
};

export let mockGreenRoom: GreenRoomPrefs = {
  defaultTitle: 'Live session',
  defaultNote: '',
  autoAnnounce: true,
  holdMusicEnabled: false,
  // Subscribers-only is the safer default — matches the invite-only framing
  // guests see in GreenRoomView before an artist opts into "everyone".
  access: 'subscribers',
};

export let mockSocial: SocialConnections = {
  website: '',
  instagram: '',
  bandcamp: '',
  soundcloud: '',
  youtube: '',
  discord: '',
  mixcloud: '',
  hearthisAt: '',
  twitch: '',
  kick: '',
  spotify: '',
  tiktok: '',
  twitter: '',
  facebook: '',
  showConnections: true,
};

export const mockMembers: ChannelMember[] = [
  {
    id: 'm1',
    username: 'demo',
    displayName: 'Demo Artist',
    role: 'OWNER',
  },
  {
    id: 'm2',
    username: 'co-host',
    displayName: 'Co Host',
    role: 'MEMBER',
  },
];

export const mockMods: ModeratorRow[] = [
  {
    id: 'mod1',
    username: 'mod-ada',
    displayName: 'Ada Mod',
    canTimeout: true,
    canDelete: true,
  },
];

export const mockChatBans: ChatBan[] = [
  {
    fingerprintHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    bannedAt: '2026-07-20T18:00:00.000Z',
  },
];

export let mockPress: PressKitMeta = {
  hasZip: false,
  bioShort: 'Demo Artist — live electronic sets from the north.',
  downloadPath: null,
  photoCount: 0,
};

export function setMockNotifications(next: typeof mockNotifications): void {
  mockNotifications = next;
}

export function setMockDiscovery(next: typeof mockDiscovery): void {
  mockDiscovery = next;
}

export function setMockGreenRoom(next: typeof mockGreenRoom): void {
  mockGreenRoom = next;
}

export function setMockSocial(next: typeof mockSocial): void {
  mockSocial = next;
}

export function setMockPress(next: typeof mockPress): void {
  mockPress = next;
}
