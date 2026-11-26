import { signIn } from './helpers/auth';
import { describePhoneOverflow } from './helpers/phoneOverflow';

describePhoneOverflow(
  'Settings',
  [
    '/settings/account',
    '/settings/security',
    '/settings/notifications',
    '/settings/playback',
    '/settings/themes',
    '/settings/plugin-store',
    '/settings/plugin-store?category=radio',
    '/settings/whats-new',
  ],
  signIn,
);
