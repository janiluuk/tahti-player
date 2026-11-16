import { createRoute, redirect } from '@tanstack/react-router';

import {
  movedSettingsSection,
  movedSettingsTarget,
  movedStudioSettingsPath,
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
  beforeLoad: ({ params, search }) => {
    const moved = movedStudioSettingsPath(
      params.section,
      (search as Record<string, unknown>).tab,
    );
    if (moved) {
      throw redirect({ href: moved, replace: true });
    }
    if (params.section === 'logs') {
      throw redirect({
        to: '/admin/logs',
        search: { tab: 'client' },
        replace: true,
      });
    }
    const movedToAudience = movedSettingsSection(params.section);
    if (movedToAudience) {
      throw redirect(movedSettingsTarget(movedToAudience));
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
