import { describePhoneOverflow } from './helpers/phoneOverflow';

describePhoneOverflow('Discover', [
  '/discover',
  '/discover?tab=feed',
  '/discover?tab=feed&view=calendar',
  '/discover?tab=events',
  '/discover?tab=parties',
  '/discover?tab=artists',
  '/discover?tab=venues',
  '/discover?tab=groups',
  '/groups',
  '/groups/trance-mixes',
  '/radio',
  '/radio/show/northern-lights',
]);
