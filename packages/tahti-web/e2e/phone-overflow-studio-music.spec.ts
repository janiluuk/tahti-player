import { signIn } from './helpers/auth';
import { describePhoneOverflow } from './helpers/phoneOverflow';

describePhoneOverflow(
  'Studio Music',
  [
    '/studio/sounds',
    '/studio/sounds?tab=embeds',
    '/studio/sounds/arch-mock-2',
    '/studio/releases',
    '/studio/releases/rel-mock-1',
    '/studio/releases/rel-mock-3',
    '/studio/releases/rel-mock-3?edit=true',
    '/studio/recordings',
    '/studio/collections',
    '/studio/collections/midnight-archive',
    '/studio/upload',
  ],
  signIn,
);
