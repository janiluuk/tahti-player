import type {
  ArtistGroupRole,
  ArtistGroupSummary,
  GroupMembershipEntry,
  MyArtistGroup,
  PublicGroupDetail,
} from './groups';
import { onMockOverridesReset } from './mock-overrides';

type MockGroup = ArtistGroupSummary & {
  founderUsername: string;
  members: PublicGroupDetail['members'];
  role: ArtistGroupRole | null;
  pendingJoinRequestCount: number;
  pendingSubmissionCount: number;
};

const SEED: MockGroup[] = [
  {
    id: 'mock-group-trance',
    slug: 'trance-mixes',
    name: 'Trance Mixes and DJ Sets',
    description: 'Shared progressive and uplifting mixes.',
    coverUrl: null,
    isPublic: true,
    joinPolicy: 'OPEN',
    submitPolicy: 'OPEN',
    collectionSlug: 'group-trance-mixes',
    memberCount: 12,
    itemCount: 48,
    role: 'OWNER',
    pendingJoinRequestCount: 1,
    pendingSubmissionCount: 0,
    founderUsername: 'demo',
    members: [
      { username: 'demo', displayName: 'Demo Artist', role: 'OWNER' },
      { username: 'luna', displayName: 'Luna', role: 'MEMBER' },
    ],
  },
  {
    id: 'mock-group-finland',
    slug: 'finland-djs',
    name: "Finland DJ's / Producers",
    description: 'Finnish scene collective.',
    coverUrl: null,
    isPublic: true,
    joinPolicy: 'REQUEST',
    submitPolicy: 'APPROVE',
    collectionSlug: 'group-finland-djs',
    memberCount: 86,
    itemCount: 2527,
    role: 'MEMBER',
    pendingJoinRequestCount: 0,
    pendingSubmissionCount: 2,
    founderUsername: 'north',
    members: [
      { username: 'north', displayName: 'North', role: 'OWNER' },
      { username: 'demo', displayName: 'Demo Artist', role: 'MEMBER' },
    ],
  },
  {
    id: 'mock-group-ambient',
    slug: 'ambient-lab',
    name: 'Ambient Lab',
    description: 'Slow, spacious, and late-night listening rooms.',
    coverUrl: null,
    isPublic: true,
    joinPolicy: 'OPEN',
    submitPolicy: 'OPEN',
    collectionSlug: 'group-ambient-lab',
    memberCount: 34,
    itemCount: 190,
    role: null,
    pendingJoinRequestCount: 0,
    pendingSubmissionCount: 0,
    founderUsername: 'aurora',
    members: [
      { username: 'aurora', displayName: 'Aurora', role: 'OWNER' },
      { username: 'drift', displayName: 'Drift', role: 'ADMIN' },
    ],
  },
  {
    id: 'mock-group-vinyl',
    slug: 'vinyl-crate',
    name: 'Vinyl Crate Diggers',
    description: 'Sample packs, crate finds, and dusty edits.',
    coverUrl: null,
    isPublic: true,
    joinPolicy: 'OPEN',
    submitPolicy: 'APPROVE',
    collectionSlug: 'group-vinyl-crate',
    memberCount: 21,
    itemCount: 77,
    role: null,
    pendingJoinRequestCount: 0,
    pendingSubmissionCount: 0,
    founderUsername: 'needle',
    members: [{ username: 'needle', displayName: 'Needle', role: 'OWNER' }],
  },
  {
    id: 'mock-group-live-electronics',
    slug: 'live-electronics',
    name: 'Live Electronics',
    description: 'Modular, laptop sets, and club-ready experiments.',
    coverUrl: null,
    isPublic: true,
    joinPolicy: 'REQUEST',
    submitPolicy: 'APPROVE',
    collectionSlug: 'group-live-electronics',
    memberCount: 15,
    itemCount: 63,
    role: null,
    pendingJoinRequestCount: 0,
    pendingSubmissionCount: 0,
    founderUsername: 'circuit',
    members: [
      { username: 'circuit', displayName: 'Circuit', role: 'OWNER' },
      { username: 'patch', displayName: 'Patch', role: 'MEMBER' },
    ],
  },
];

let store: MockGroup[] | null = null;
const membershipBySound = new Map<string, Set<string>>();
const pendingJoin = new Set<string>();

onMockOverridesReset(() => {
  store = null;
  membershipBySound.clear();
  pendingJoin.clear();
});

function getStore(): MockGroup[] {
  if (!store) {
    store = SEED.map((row) => ({
      ...row,
      members: row.members.map((m) => ({ ...m })),
    }));
  }
  return store;
}

function asMyGroup(group: MockGroup): MyArtistGroup {
  if (!group.role) {
    throw new Error(`Group ${group.slug} has no membership role`);
  }
  return {
    id: group.id,
    slug: group.slug,
    name: group.name,
    description: group.description,
    coverUrl: group.coverUrl,
    isPublic: group.isPublic,
    joinPolicy: group.joinPolicy,
    submitPolicy: group.submitPolicy,
    collectionSlug: group.collectionSlug,
    memberCount: group.memberCount,
    itemCount: group.itemCount,
    role: group.role,
    pendingJoinRequestCount: group.pendingJoinRequestCount,
    pendingSubmissionCount: group.pendingSubmissionCount,
  };
}

export function mockFetchMyGroups(): MyArtistGroup[] {
  return getStore()
    .filter((group) => group.role !== null)
    .map(asMyGroup);
}

export function mockCreateGroup(input: {
  name: string;
  description?: string;
  isPublic?: boolean;
  joinPolicy?: MyArtistGroup['joinPolicy'];
  submitPolicy?: MyArtistGroup['submitPolicy'];
}): MyArtistGroup {
  const slug =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || `group-${Date.now()}`;
  const created: MockGroup = {
    id: `mock-group-${slug}`,
    slug,
    name: input.name,
    description: input.description ?? null,
    coverUrl: null,
    isPublic: input.isPublic ?? true,
    joinPolicy: input.joinPolicy ?? 'OPEN',
    submitPolicy: input.submitPolicy ?? 'OPEN',
    collectionSlug: `group-${slug}`,
    memberCount: 1,
    itemCount: 0,
    role: 'OWNER',
    pendingJoinRequestCount: 0,
    pendingSubmissionCount: 0,
    founderUsername: 'demo',
    members: [{ username: 'demo', displayName: 'Demo Artist', role: 'OWNER' }],
  };
  getStore().unshift(created);
  return asMyGroup(created);
}

export function mockPatchGroup(
  slug: string,
  patch: Partial<MyArtistGroup>,
): MyArtistGroup | null {
  const group = getStore().find((row) => row.slug === slug);
  if (!group) {
    return null;
  }
  Object.assign(group, patch);
  return asMyGroup(group);
}

export function mockJoinGroup(
  slug: string,
):
  | { ok: true; joined: boolean; pending: boolean }
  | { ok: false; error: string } {
  const group = getStore().find((row) => row.slug === slug);
  if (!group) {
    return { ok: false, error: 'Group not found' };
  }
  if (group.joinPolicy === 'REQUEST') {
    pendingJoin.add(slug);
    return { ok: true, joined: false, pending: true };
  }
  group.role = 'MEMBER';
  group.memberCount += 1;
  return { ok: true, joined: true, pending: false };
}

export function mockLeaveGroup(
  slug: string,
): { ok: true } | { ok: false; error: string } {
  pendingJoin.delete(slug);
  const group = getStore().find((row) => row.slug === slug);
  if (group?.role === 'OWNER') {
    return { ok: false, error: 'Owner cannot leave' };
  }
  return { ok: true };
}

export function mockGroupMembership(_soundId: string): GroupMembershipEntry[] {
  const selected = membershipBySound.get(_soundId) ?? new Set();
  return getStore().map((group) => ({
    id: group.id,
    slug: group.slug,
    name: group.name,
    coverUrl: group.coverUrl,
    isPublic: group.isPublic,
    submitPolicy: group.submitPolicy,
    role: group.role,
    collectionSlug: group.collectionSlug,
    itemCount: group.itemCount,
    member: selected.has(group.slug),
    itemId: selected.has(group.slug) ? `mock-gitem-${group.slug}` : null,
    submissionPending: false,
  }));
}

export function mockSubmitGroupSound(
  slug: string,
  soundId: string,
):
  | { ok: true; added: boolean; pending: boolean; itemId: string | null }
  | { ok: false; error: string } {
  const group = getStore().find((row) => row.slug === slug);
  if (!group) {
    return { ok: false, error: 'Group not found' };
  }
  if (group.submitPolicy === 'APPROVE' && group.role === 'MEMBER') {
    return { ok: true, added: false, pending: true, itemId: null };
  }
  const set = membershipBySound.get(soundId) ?? new Set();
  set.add(slug);
  membershipBySound.set(soundId, set);
  group.itemCount += 1;
  return {
    ok: true,
    added: true,
    pending: false,
    itemId: `mock-gitem-${slug}`,
  };
}

export function mockFetchPublicGroups(q?: string): {
  items: ArtistGroupSummary[];
  total: number;
} {
  const needle = q?.trim().toLowerCase() ?? '';
  const items = getStore()
    .filter((g) => g.isPublic)
    .filter(
      (g) =>
        !needle ||
        g.name.toLowerCase().includes(needle) ||
        g.slug.includes(needle),
    )
    .map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      description: g.description,
      coverUrl: g.coverUrl,
      isPublic: g.isPublic,
      joinPolicy: g.joinPolicy,
      submitPolicy: g.submitPolicy,
      collectionSlug: g.collectionSlug,
      memberCount: g.memberCount,
      itemCount: g.itemCount,
    }));
  return { items, total: items.length };
}

export function mockFetchPublicGroup(slug: string): PublicGroupDetail | null {
  const group = getStore().find((row) => row.slug === slug);
  if (!group) {
    return null;
  }
  return {
    id: group.id,
    slug: group.slug,
    name: group.name,
    description: group.description,
    coverUrl: group.coverUrl,
    isPublic: group.isPublic,
    joinPolicy: group.joinPolicy,
    submitPolicy: group.submitPolicy,
    collectionSlug: group.collectionSlug,
    memberCount: group.memberCount,
    itemCount: group.itemCount,
    createdBy: {
      username: group.founderUsername,
      displayName:
        group.members.find((m) => m.username === group.founderUsername)
          ?.displayName ?? group.founderUsername,
    },
    members: group.members,
    viewer: {
      role: group.role,
      joinRequestPending: pendingJoin.has(slug),
    },
  };
}

export function mockResolveJoinRequest(): { ok: true } {
  return { ok: true };
}

export function mockApproveSubmission(): { ok: true } {
  return { ok: true };
}

export function mockRejectSubmission(): { ok: true } {
  return { ok: true };
}
