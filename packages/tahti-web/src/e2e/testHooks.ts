import { fetchTrackDetail } from '../api/client';
import { getMockSessionUser, setMockSessionUser } from '../api/mock-session';
import { fetchPublicSoundDownload } from '../api/public-sound-download';
import { createPurchaseTier, setSoundAccess } from '../api/purchase-tiers';
import { fetchMeProfile } from '../api/studio-extras';

/**
 * App internals the Playwright journeys drive from `page.evaluate`. A built
 * bundle cannot serve `/src/*.ts`, so specs reach them through
 * `window.__tahtiE2e` instead.
 */
export const tahtiE2eHooks = {
  createPurchaseTier,
  setSoundAccess,
  fetchTrackDetail,
  fetchPublicSoundDownload,
  fetchMeProfile,
  getMockSessionUser,
  setMockSessionUser,
};

export type TahtiE2eHooks = typeof tahtiE2eHooks;

declare global {
  interface Window {
    __tahtiE2e?: TahtiE2eHooks;
  }
}

export function installE2eHooks(target: Window): void {
  target.__tahtiE2e = tahtiE2eHooks;
}
