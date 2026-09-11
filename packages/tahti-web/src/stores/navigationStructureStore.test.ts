import { describe, expect, it } from 'vitest';

import { useNavigationStructureStore } from './navigationStructureStore';

describe('navigationStructureStore', () => {
  it('adds, reorders, and removes draft items without wiring navigation', () => {
    useNavigationStructureStore.setState({
      items: [
        { id: 'one', label: 'One', path: '/one' },
        { id: 'two', label: 'Two', path: '/two' },
      ],
    });
    const store = useNavigationStructureStore.getState();

    store.addItem('Three', '/three');
    expect(useNavigationStructureStore.getState().items).toHaveLength(3);
    const addedItem = useNavigationStructureStore.getState().items[2]!;
    store.moveItem(addedItem.id, -1);
    expect(
      useNavigationStructureStore.getState().items.map((item) => item.id),
    ).toEqual(['one', addedItem.id, 'two']);
    store.removeItem(addedItem.id);
    expect(
      useNavigationStructureStore.getState().items.map((item) => item.id),
    ).toEqual(['one', 'two']);
  });

  it('ignores incomplete additions', () => {
    const before = useNavigationStructureStore.getState().items.length;
    useNavigationStructureStore.getState().addItem(' ', '/missing-label');
    useNavigationStructureStore.getState().addItem('Missing path', ' ');
    expect(useNavigationStructureStore.getState().items).toHaveLength(before);
  });
});
