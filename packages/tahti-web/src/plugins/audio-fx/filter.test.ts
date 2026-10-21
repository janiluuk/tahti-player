import { describe, expect, it } from 'vitest';

import { createDefaultEditList } from '../../api/studio-types';
import { filterPlugin, SHELF_CUT_DB } from './filter';
import { createFakeAudioContext } from './testAudioContext';

type FakeBiquadNode = {
  type: BiquadFilterType;
  frequency: { value: number };
  Q: { value: number };
  gain: { value: number };
};

describe('filterPlugin', () => {
  it('is enabled iff editList.filter.enabled', () => {
    const editList = createDefaultEditList(180);
    expect(filterPlugin.isEnabled(editList)).toBe(false);
    expect(
      filterPlugin.isEnabled({
        ...editList,
        filter: { ...editList.filter, enabled: true },
      }),
    ).toBe(true);
  });

  it('carries the chosen mode and frequency onto the filter node', () => {
    const editList = createDefaultEditList(180);
    editList.filter = {
      enabled: true,
      mode: 'lowshelf',
      freq: 120,
      slope: '24db',
    };

    const [node] = filterPlugin.buildPreviewNodes(
      createFakeAudioContext(),
      editList,
    ) as unknown as [FakeBiquadNode];

    expect(node.type).toBe('lowshelf');
    expect(node.frequency.value).toBe(120);
  });

  it('cascades stages like the render: 1/2/4 for 12 dB, 24 dB and brickwall', () => {
    const editList = createDefaultEditList(180);
    for (const [slope, count] of [
      ['12db', 1],
      ['24db', 2],
      ['brickwall', 4],
    ] as const) {
      editList.filter = { enabled: true, mode: 'highpass', freq: 80, slope };
      const nodes = filterPlugin.buildPreviewNodes(
        createFakeAudioContext(),
        editList,
      ) as unknown as FakeBiquadNode[];
      expect(nodes).toHaveLength(count);
      expect(nodes.every((node) => node.Q.value === Math.SQRT1_2)).toBe(true);
    }
  });

  it('applies shelves as a cut, as the render does (they used to do nothing)', () => {
    const editList = createDefaultEditList(180);
    editList.filter = {
      enabled: true,
      mode: 'highshelf',
      freq: 8000,
      slope: 'brickwall',
    };
    const nodes = filterPlugin.buildPreviewNodes(
      createFakeAudioContext(),
      editList,
    ) as unknown as FakeBiquadNode[];
    expect(nodes).toHaveLength(2);
    expect(nodes.every((node) => node.gain.value === SHELF_CUT_DB)).toBe(true);
  });

  it('changes its preview shape only when the node list would change', () => {
    const editList = createDefaultEditList(180);
    const shape = filterPlugin.previewShape!(editList);
    expect(
      filterPlugin.previewShape!({
        ...editList,
        filter: { ...editList.filter, freq: 5000 },
      }),
    ).toBe(shape);
    expect(
      filterPlugin.previewShape!({
        ...editList,
        filter: { ...editList.filter, slope: '24db' },
      }),
    ).not.toBe(shape);
  });
});
