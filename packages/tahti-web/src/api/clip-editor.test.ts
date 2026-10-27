import { expect, it } from 'vitest';

import { ORIGINAL_VOICE, voiceSettingsKey } from './clip-editor';

it('matches previews despite server JSON key ordering', () => {
  const audio = { startSec: 0, endSec: 8, fadeInSec: 0, fadeOutSec: 0 };
  expect(voiceSettingsKey({ ...audio, ...ORIGINAL_VOICE })).toBe(
    voiceSettingsKey({ ...ORIGINAL_VOICE, ...audio }),
  );
});
