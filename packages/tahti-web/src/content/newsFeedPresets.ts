export type NewsFeedPreset = {
  title: string;
  url: string;
  description: string;
};

export type NewsFeedPresetGroup = {
  id: 'dj' | 'production';
  title: string;
  feeds: NewsFeedPreset[];
};

/** Public RSS feeds offered in the News add-on, checked 2026-10-21: each
 * answers 200 without a redirect and stays under the API proxy's 512 KB
 * limit (`fetchGuardedFeed` in tahti-org). Shown as headlines that link to
 * their source; nothing is republished. */
export const NEWS_FEED_PRESET_GROUPS: NewsFeedPresetGroup[] = [
  {
    id: 'dj',
    title: 'DJ & electronic music',
    feeds: [
      {
        title: 'DJ Mag',
        url: 'https://djmag.com/rss.xml',
        description: 'News, features and the Top 100 from DJ Mag.',
      },
      {
        title: 'Mixmag',
        url: 'https://mixmag.net/rss.xml',
        description: 'Club culture news, mixes and features.',
      },
      {
        title: 'XLR8R',
        url: 'https://xlr8r.com/feed/',
        description: 'Electronic music news, podcasts and downloads.',
      },
      {
        title: 'FACT',
        url: 'https://www.factmag.com/feed/',
        description: 'Music, art and technology from FACT Magazine.',
      },
      {
        title: 'Magnetic Magazine',
        url: 'https://magneticmag.com/feed/',
        description: 'Electronic music news and premieres.',
      },
      {
        title: 'Digital DJ Tips',
        url: 'https://www.digitaldjtips.com/feed/',
        description: 'DJ technique, gear reviews and tutorials.',
      },
      {
        title: 'DJ TechTools',
        url: 'https://djtechtools.com/feed/',
        description: 'DJ controllers, software and performance tips.',
      },
    ],
  },
  {
    id: 'production',
    title: 'Music production',
    feeds: [
      {
        title: 'Sound On Sound',
        url: 'https://www.soundonsound.com/rss.xml',
        description: 'Recording, mixing and studio gear.',
      },
      {
        title: 'Synthtopia',
        url: 'https://www.synthtopia.com/feed/',
        description: 'Synthesizers, modular and electronic instruments.',
      },
      {
        title: 'Attack Magazine',
        url: 'https://www.attackmagazine.com/feed/',
        description: 'Electronic music production techniques and reviews.',
      },
      {
        title: 'CDM',
        url: 'https://cdm.link/feed/',
        description: 'Create Digital Music: instruments, software and makers.',
      },
      {
        title: 'Bedroom Producers Blog',
        url: 'https://bedroomproducersblog.com/feed/',
        description: 'Free and affordable plugins, samples and deals.',
      },
      {
        title: 'gearnews',
        url: 'https://www.gearnews.com/feed/',
        description: 'Synths, studio gear and plugin releases.',
      },
      {
        title: 'Point Blank',
        url: 'https://www.pointblankmusicschool.com/blog/feed/',
        description: 'Production and DJ tutorials from Point Blank.',
      },
    ],
  },
];
