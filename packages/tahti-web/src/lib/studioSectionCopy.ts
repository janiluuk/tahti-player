import type { ParseKeys } from '@tahti-player/i18n';

import {
  STUDIO_CHANNEL_SECTIONS,
  STUDIO_PROFILE_SECTIONS,
  studioChannelPath,
  studioProfilePath,
  type StudioChannelSection,
  type StudioProfileSection,
} from './studioProfileSections';

type SectionCopy = { title: ParseKeys<'web'>; description: ParseKeys<'web'> };

/** Tab label (also the page title) and one-line description of every
 * Studio → Profile and Studio → Channel page. */
export const STUDIO_SECTION_COPY = {
  identity: {
    title: 'studioProfileView.identity',
    description: 'studioProfileView.identityDescription',
  },
  connections: {
    title: 'studioProfileView.links',
    description: 'studioProfileView.yourWebsiteSocialsAndStreaming',
  },
  'link-page': {
    title: 'linkPage.tab',
    description: 'studioProfileView.linkPageDescription',
  },
  branding: {
    title: 'studioProfileView.branding',
    description: 'studioProfileView.brandingDescription',
  },
  gallery: {
    title: 'studioProfileView.galleryAndPressKit',
    description: 'studioProfileView.galleryDescription',
  },
  design: {
    title: 'studioProfileView.design',
    description: 'studioProfileView.howYourChannelPageLooks',
  },
  radio: {
    title: 'studioChannelViewStates.radio',
    description: 'studioProfileView.radioDescription',
  },
  visibility: {
    title: 'studioProfileView.visibility',
    description: 'studioProfileView.visibilityDescription',
  },
  address: {
    title: 'studioProfileView.address',
    description: 'studioProfileView.yourChannelAddressAndA',
  },
} as const satisfies Record<
  StudioProfileSection | StudioChannelSection,
  SectionCopy
>;

export const PROFILE_SUBNAV_ITEMS = STUDIO_PROFILE_SECTIONS.map((section) => ({
  to: studioProfilePath(section),
  labelKey: STUDIO_SECTION_COPY[section].title,
}));

export const CHANNEL_SUBNAV_ITEMS = STUDIO_CHANNEL_SECTIONS.map((section) => ({
  to: studioChannelPath(section),
  labelKey: STUDIO_SECTION_COPY[section].title,
}));
