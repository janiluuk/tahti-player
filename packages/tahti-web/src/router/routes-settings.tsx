import { createRoute, redirect } from '@tanstack/react-router';

import {
  movedSettingsSection,
  movedSettingsTarget,
} from '../lib/movedSettingsSections';
import { appLayoutRoute } from './router-core';
import { OnboardingView, SettingsView } from './router-lazy-views';

export const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: () => <SettingsView />,
});

export const settingsSectionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/$section',
  beforeLoad: ({ params }) => {
    const moved = movedSettingsSection(params.section);
    if (moved) {
      throw redirect(movedSettingsTarget(moved));
    }
  },
  component: () => <SettingsView />,
});

export const feedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/feed',
  beforeLoad: () => {
    throw redirect({ to: '/discover', search: { tab: 'feed' } });
  },
});

export const onboardingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/onboarding',
  component: OnboardingView,
});
