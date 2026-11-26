import { signIn } from './helpers/auth';
import { describePhoneOverflow } from './helpers/phoneOverflow';

describePhoneOverflow(
  'Studio Broadcast and Channel',
  [
    '/studio/broadcast',
    '/studio/go-live',
    '/studio/go-live?step=encoder',
    '/studio/go-live?step=destinations',
    '/studio/schedule',
    '/studio/schedule?show=events',
    '/studio/schedule?show=parties',
    '/studio/shows',
    '/studio/shows/show-series-demo',
    '/studio/shows/episodes/ep-demo-3',
    '/studio/channel/design',
    '/studio/channel/radio',
    '/studio/channel/radio?tab=pinned',
    '/studio/channel/settings',
    '/studio/channel/address',
    '/studio/channel/clips',
    '/studio/chat',
    '/studio/listening-parties',
    '/studio/events/new',
  ],
  signIn,
);
