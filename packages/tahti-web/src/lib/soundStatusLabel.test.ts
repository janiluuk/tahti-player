import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { soundStatusLabel } from './soundStatusLabel';

describe('soundStatusLabel', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('names each sound status in English and Finnish', () => {
    const en = i18n.getFixedT('en_US', 'web');
    const fi = i18n.getFixedT('fi_FI', 'web');
    expect(
      ['PENDING', 'PROCESSING', 'READY', 'ERROR'].map((s) =>
        soundStatusLabel(s, en),
      ),
    ).toEqual([
      'Waiting to process',
      'Processing',
      'Ready',
      'Processing failed',
    ]);
    expect(soundStatusLabel('PROCESSING', fi)).toBe('Käsitellään');
  });

  it('reads an unknown status in sentence case', () => {
    const en = i18n.getFixedT('en_US', 'web');
    expect(soundStatusLabel('NEEDS_REVIEW', en)).toBe('Needs review');
  });
});
