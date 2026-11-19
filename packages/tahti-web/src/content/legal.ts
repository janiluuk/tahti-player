export type LegalPage = {
  slug: 'about' | 'what-is-it' | 'how-it-works';
  title: string;
  description: string;
  productionPath: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
};

/** Cross-links shown at the bottom of every legal/info page — including
 * terms, privacy, and the AGPL notice, which render through their own
 * dedicated views (TermsView/PrivacyView/AgplView) rather than this file's
 * plain-paragraph LegalPage shape, since their real text needs lists,
 * definition lists, and links, not just prose. */
export const LEGAL_HUB_LINKS: Array<{
  slug: string;
  title: string;
  to: string;
}> = [
  { slug: 'about', title: 'About Tahti', to: '/about' },
  { slug: 'terms', title: 'Terms of service', to: '/terms' },
  { slug: 'privacy', title: 'Privacy policy', to: '/privacy' },
  { slug: 'agpl', title: 'Source code & AGPL licence', to: '/agpl' },
  { slug: 'what-is-it', title: 'What is it', to: '/what-is-it' },
  { slug: 'how-it-works', title: 'How Tahti works', to: '/how-it-works' },
  { slug: 'for-artists', title: 'Tahti for artists', to: '/for-artists' },
];

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: 'about',
    title: 'About Tahti',
    description:
      'A Finnish nonprofit broadcasting platform owned and governed by its artist members.',
    productionPath: '/about',
    sections: [
      {
        heading: 'Our mission',
        paragraphs: [
          'Tahti ry is a Finnish nonprofit association founded to put money, audience, and infrastructure in the hands of independent musicians — with no shareholders, no advertising, and no exit.',
          'The platform exists to be the best broadcasting home for independent artists. Quality is a constitutional obligation, not an aspiration.',
        ],
      },
      {
        heading: 'How the money works',
        paragraphs: [
          'Artists can use a free tier or support the cooperative with membership (€40/year). Operating surplus is largely returned to artists as grants based on engagement.',
          'Fan subscriptions go almost entirely to the artist (2% platform fee into the grant pool). Full ledgers live on the transparency page.',
        ],
      },
      {
        heading: 'Open source',
        paragraphs: [
          'Tahti is AGPL-licensed. See the AGPL notice in this app and the public source repository for details.',
        ],
      },
    ],
  },
  {
    slug: 'what-is-it',
    title: 'What is Tahti',
    description:
      'A nonprofit broadcasting platform owned and governed by its artist members. No shareholders, no ads, AGPL-3.0.',
    productionPath: '/what-is-it',
    sections: [
      {
        heading: 'Who it is for',
        paragraphs: [
          'Independent artists, DJs, bands and collectives who want one home for live shows, 24/7 channels and releases — plus listeners who want lossless audio without ads or tracking, and members who vote on how the platform is run.',
        ],
      },
      {
        heading: 'What it does',
        paragraphs: [
          'Tahti closes the gap between five disconnected vendors (streaming host, release toolkit, fan payments, profile site, opaque terms) with one member-owned platform: always-on channels, Studio tools, fan subscriptions and public grants.',
        ],
      },
      {
        heading: 'What you get',
        paragraphs: [
          'Live broadcasting (OBS / Mixxx / Traktor, green room, multistream, Tahti Radio), library and release tooling, fan-to-artist payments with a 2% ops fee, discovery without algorithmic ranking, co-op governance with a public ledger, and the full stack under AGPL-3.0. Artist membership is €40/year; listening is free. Ninety percent of operating surplus returns to artists as grants.',
        ],
      },
    ],
  },
  {
    slug: 'how-it-works',
    title: 'How Tahti works',
    description:
      'Not a features list — a walkthrough. What actually happens when you listen, and what actually happens when you broadcast. Every number below is the same number published on the transparency page.',
    productionPath: '/how-it-works',
    sections: [
      {
        heading: 'For listeners',
        paragraphs: [
          "You don't need an account to listen. You never will — that's constitutional, not a growth-hack limit that gets tightened later.",
          'Find a channel. Browse who’s on air, tune into an artist’s 24/7 channel (live blends straight into their archive when they’re offline), or listen to Tahti Radio, a fair-rotation meta-stream of the whole community. No algorithm decides what you hear next — there is no "recommended for you" on Tahti, by design.',
          "Hear it in full quality, free. Every listener gets FLAC 16/44 lossless audio on a member artist's channel, whether or not you or the artist pay for anything. Most platforms cap free listeners at 128 kbps or lower. Tahti doesn't gate audio quality at the listener tier — that's constitutional too.",
          'Support an artist directly, if you want to. Fan subscriptions run €1–€100/month — the artist sets the price — straight from you to them.',
          'Stay anonymous. Listening, downloading, and chatting all work without an account. Where an account exists (subscribing costs money, so billing needs one), IP hashes rotate daily — we cannot tell that the same listener came back yesterday. No tracking beyond what the product strictly needs to run, no cookies for analytics, no ads, ever.',
        ],
      },
      {
        heading: 'For artists',
        paragraphs: [
          'The free tier is a complete product, not a trial. Everything below works whether or not you ever pay Tahti a cent.',
          'Create your channel. Your own handle.tahti.live and /c/your-slug — set up in minutes from the dashboard.',
          "Broadcast, and keep an archive that never goes dark. Go live from OBS, Mixxx, Traktor, or straight from the browser. When you're offline, your channel plays your archive on a seamless loop — listeners never hit a dead page. Free tier broadcasts at MP3 192 kbps; members and their listeners get FLAC lossless.",
          "Get paid two ways. Fan subscriptions keep 98% for you — the 2% operational fee covers Stripe and support, and any surplus it generates rolls into next year's grant pool rather than becoming Tahti's profit. Separately, 90% of the platform's entire annual operating surplus is distributed to artists as grants, split by engagement units — downloads and fan-sub euros, not passive plays — so an artist whose audience actually cares gets more than one who just racks up listener-hours.",
          'Distribute everywhere else too. A smart link with DSP buttons for Spotify, Apple Music, Bandcamp, and more. One-form delivery to Spotify/Apple/Tidal via Revelator, plus direct Mixcloud publishing.',
          'Get a real vote, not a feedback form. Every artist member votes at the AGM. The board is elected from the membership. The roadmap is public, and it changes based on what members actually approve — not founder discretion.',
        ],
      },
      {
        heading: 'The money, transparently',
        paragraphs: [
          "This isn't a marketing summary of the numbers — it's the same rule the board operates under, published in the org's own constitution:",
          'Fan-subscriptions: 98% to the artist, 2% operational fee, 0% Tahti profit.',
          'Annual surplus: 90% distributed to artists as grants, 10% held in an operating reserve capped at 6 months of costs — anything above that cap goes back to artists too.',
          'No venture capital, no equity, no exit. Tahti ry is a Finnish nonprofit association (yhdistys) — it legally cannot become a for-profit company without dissolving the membership.',
          'Every euro in and out is published, monthly, in an append-only ledger — not a once-a-year PDF.',
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return LEGAL_PAGES.find((p) => p.slug === slug);
}
