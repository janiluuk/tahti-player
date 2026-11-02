import {
  BanknoteIcon,
  HeartIcon,
  NewspaperIcon,
  SendIcon,
  ShoppingBagIcon,
} from 'lucide-react';

import { HubCards, ViewShell, type HubCardItem } from '@tahti-player/ui';

import { renderHubLink } from '../../components/HubLink';
import { StudioGate } from '../../components/StudioGate';

export const STUDIO_FANS_ITEMS: HubCardItem[] = [
  {
    id: 'posts',
    href: '/studio/updates',
    icon: NewspaperIcon,
    title: 'Posts',
    description: 'Updates on your channel page and in your followers’ feeds.',
  },
  {
    id: 'newsletter',
    href: '/studio/updates?tab=newsletter',
    icon: SendIcon,
    title: 'Newsletter',
    description: 'Email a post to the fans who signed up for it.',
  },
  {
    id: 'memberships',
    href: '/studio/audience?tab=tiers',
    icon: HeartIcon,
    title: 'Memberships',
    description: 'Monthly support tiers fans can subscribe to.',
  },
  {
    id: 'store',
    href: '/studio/audience?tab=store',
    icon: ShoppingBagIcon,
    title: 'Store',
    description: 'What is for sale on your channel page, and your track sales.',
  },
  {
    id: 'earnings',
    href: '/studio/audience',
    icon: BanknoteIcon,
    title: 'Earnings',
    description: 'Subscribers, orders, payouts, grants and the Stripe account.',
  },
];

export function StudioFansView() {
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title="Fans"
          subtitle="Everything between you and the people who support you: posts, the newsletter, memberships, the store and what you earn."
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <HubCards
            aria-label="Fans tools"
            items={STUDIO_FANS_ITEMS}
            renderLink={renderHubLink}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
