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

  it('adds, reorders, and removes nested submenu items', () => {
    useNavigationStructureStore.setState({
      items: [
        {
          id: 'parent',
          label: 'Parent',
          path: '/parent',
          children: [
            { id: 'child-one', label: 'Child one', path: '/parent/one' },
          ],
        },
      ],
    });
    const store = useNavigationStructureStore.getState();

    store.addItem('Child two', '/parent/two', 'parent');
    let items = useNavigationStructureStore.getState().items;
    expect(items[0]!.children).toHaveLength(2);
    const childTwoId = items[0]!.children![1]!.id;

    store.moveItem(childTwoId, -1);
    items = useNavigationStructureStore.getState().items;
    expect(items[0]!.children!.map((child) => child.id)).toEqual([
      childTwoId,
      'child-one',
    ]);

    store.removeItem(childTwoId);
    items = useNavigationStructureStore.getState().items;
    expect(items[0]!.children!.map((child) => child.id)).toEqual(['child-one']);
  });
});
