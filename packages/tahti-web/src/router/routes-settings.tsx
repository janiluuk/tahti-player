import { createRoute, redirect } from '@tanstack/react-router';

import { appLayoutRoute } from './router-core';
import { FeedView, OnboardingView, SettingsView } from './router-lazy-views';

export const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: () => <SettingsView />,
});

export const settingsSectionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/$section',
  beforeLoad: ({ params }) => {
    // Former Settings → Audience / money panels now live under Studio.
    if (
      params.section === 'audience' ||
      params.section === 'money' ||
      params.section === 'fan-subs' ||
      params.section === 'fan-tiers'
    ) {
      throw redirect({ to: '/studio/audience' });
    }
  },
  component: function SettingsSectionRoute() {
    const { section } = settingsSectionRoute.useParams();
    return <SettingsView sectionId={section} />;
  },
});

export const feedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/feed',
  component: FeedView,
});

export const onboardingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/onboarding',
  component: OnboardingView,
});
