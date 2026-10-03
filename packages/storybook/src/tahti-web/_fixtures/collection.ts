import type { CollectionItemContribution } from '@tahti-web/api/collection-contribution';
import type { CollectionItem, PublicCollection } from '@tahti-web/api/types';

import type { MockOverrides } from '../_lib/mock-data';

export const COLLECTION_SLUG = 'night-shift-swaps';
export const COLLECTION_NAME = 'Night Shift Swaps';

type ContributedItem = CollectionItem & CollectionItemContribution;

function collaborativeCollection(base: PublicCollection): PublicCollection {
  const [first, second, ...rest] = base.items;
  const audioUrl = first?.sound?.audioUrl ?? null;
  const items: ContributedItem[] = [
    // No addedBy: a row the owner added shows only its note.
    ...(first ? [{ ...first, addNote: 'Where it all started.' }] : []),
    ...(second
      ? [
          {
            ...second,
            addedBy: { username: 'listener-liina', displayName: 'Liina' },
            addNote: 'Perfect for the 3am bus home',
          },
        ]
      : []),
    {
      id: 'col-item-moonlight',
      position: 2,
      sound: {
        id: 'dj-moonlight-archive-1',
        title: 'After Hours Drive',
        durationSec: 284,
        bannerUrl: '/mock/dj-moonlight/cover-after-hours.svg',
        audioUrl,
        channel: { slug: 'dj-moonlight' },
      },
      release: null,
      addedBy: { username: 'dj-moonlight', displayName: 'DJ Moonlight' },
      addNote: null,
    },
    ...rest.map((item, index) => ({ ...item, position: 3 + index })),
    {
      id: 'col-item-release',
      position: 9,
      sound: null,
      release: {
        id: 'northern-lights-rel-2',
        title: 'Polar Static',
        type: 'ALBUM',
        smartLinkSlug: 'northern-lights-release-2',
      },
    },
  ];
  return {
    ...base,
    slug: COLLECTION_SLUG,
    name: COLLECTION_NAME,
    description:
      'A shared playlist for the night shift. Anyone signed in can add a track and say why.',
    collaborative: true,
    isPublic: true,
    items,
    links: {
      page: `https://tahti.live/u/${base.user.username}/c/${COLLECTION_SLUG}`,
      rss: `/api/v1/collections/${COLLECTION_SLUG}/rss.xml`,
    },
  };
}

/** Collaborative, public: "Added by" + notes, an embed-only row, a linked
 * release, the RSS button and the add-a-track panel. */
export const collectionCollaborativeData: MockOverrides = {
  collection: (base) => collaborativeCollection(base),
};

/** Private and not collaborative: no RSS, report, subscribe or add panel. */
export const collectionPrivateData: MockOverrides = {
  collection: (base) => ({
    ...collaborativeCollection(base),
    collaborative: false,
    isPublic: false,
  }),
};

export const collectionEmptyData: MockOverrides = {
  collection: (base) => ({
    ...collaborativeCollection(base),
    collaborative: false,
    items: [],
  }),
};
