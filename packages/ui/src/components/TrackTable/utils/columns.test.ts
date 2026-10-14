import { getActionsColumn } from './columns';

const ContextMenuWrapper = () => null;

describe('getActionsColumn', () => {
  it('folds the queue button into the track menu in a narrow table', () => {
    const column = getActionsColumn({
      tracks: [],
      displayQueueControls: true,
      actions: { onAddToQueue: vi.fn() },
      meta: { ContextMenuWrapper },
    });
    expect(column.className).toBe('w-20 @max-md:w-10');
  });

  it('keeps the queue button when there is no track menu to hold it', () => {
    const column = getActionsColumn({
      tracks: [],
      displayQueueControls: true,
      actions: { onAddToQueue: vi.fn() },
    });
    expect(column.className).toBe('w-10');
  });
});
