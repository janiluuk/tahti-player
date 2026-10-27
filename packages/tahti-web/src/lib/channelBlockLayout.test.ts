import { describe, expect, it } from 'vitest';

import type { ChannelBlockWidth } from '../api/channel-blocks';
import {
  packChannelBlocks,
  reorderedBlockIds,
  withoutPlacedAddons,
} from './channelBlockLayout';

const widths = (...list: ChannelBlockWidth[]) =>
  list.map((width, index) => ({ id: `b${index}`, width }));

describe('packChannelBlocks', () => {
  it('fills rows of six units in order', () => {
    const rows = packChannelBlocks(
      widths('HALF', 'HALF', 'THIRD', 'THIRD', 'THIRD', 'FULL'),
    );

    expect(rows.map((row) => row.map((block) => block.id))).toEqual([
      ['b0', 'b1'],
      ['b2', 'b3', 'b4'],
      ['b5'],
    ]);
  });

  it('starts a new row when a block does not fit and leaves the gap', () => {
    const rows = packChannelBlocks(widths('THIRD', 'THIRD', 'HALF', 'FULL'));

    expect(rows.map((row) => row.map((block) => block.width))).toEqual([
      ['THIRD', 'THIRD'],
      ['HALF'],
      ['FULL'],
    ]);
  });
});

describe('reorderedBlockIds', () => {
  it('follows the add-on order and keeps logo slots', () => {
    const blocks = [
      { id: 'logo', installId: null },
      { id: 'block-a', installId: 'a' },
      { id: 'block-b', installId: 'b' },
    ];

    expect(reorderedBlockIds(blocks, ['b', 'a'])).toEqual([
      'logo',
      'block-b',
      'block-a',
    ]);
  });
});

describe('withoutPlacedAddons', () => {
  it('drops the add-ons the layout already shows', () => {
    const widgets = [{ installId: 'a' }, { installId: 'b' }];

    expect(
      withoutPlacedAddons(widgets, [
        { addon: { installId: 'a' } },
        { addon: null },
      ]),
    ).toEqual([{ installId: 'b' }]);
  });
});
