import { usePlayerStore } from '../../stores/playerStore';
import { McpUserError, type DomainDef } from './types';

export function queueItems() {
  const { queue, currentId } = usePlayerStore.getState();
  return queue.map((item, index) => ({
    index,
    id: item.id,
    title: item.track.title,
    artist: item.track.artists.map((artist) => artist.name).join(', '),
    current: item.id === currentId,
  }));
}

function requireItem(id: unknown) {
  if (!usePlayerStore.getState().queue.some((item) => item.id === id)) {
    throw new McpUserError(
      `No queue item has the id "${String(id)}". Queue.get lists the ids.`,
    );
  }
}

function requireIndex(name: string, index: unknown) {
  const length = usePlayerStore.getState().queue.length;
  if (
    !Number.isInteger(index) ||
    (index as number) < 0 ||
    (index as number) >= length
  ) {
    throw new McpUserError(
      `${name} must be a whole number from 0 to ${Math.max(0, length - 1)}.`,
    );
  }
}

export const queueDomain: DomainDef = {
  description:
    'The play queue: list it, jump to an item, remove, move or clear items.',
  methods: {
    get: {
      description: 'Every queue item in order, with the current one marked.',
      params: [],
      returns: 'QueueItem[]',
      run: queueItems,
    },
    playItem: {
      description: 'Start playing a queue item.',
      params: [
        {
          name: 'id',
          type: 'string',
          description: 'A queue item id from Queue.get.',
        },
      ],
      returns: 'QueueItem[]',
      run: ({ id }) => {
        requireItem(id);
        usePlayerStore.getState().playQueueIndex(id as string);
        return queueItems();
      },
    },
    remove: {
      description: 'Remove one item from the queue.',
      params: [
        {
          name: 'id',
          type: 'string',
          description: 'A queue item id from Queue.get.',
        },
      ],
      returns: 'QueueItem[]',
      run: ({ id }) => {
        requireItem(id);
        usePlayerStore.getState().removeFromQueue(id as string);
        return queueItems();
      },
    },
    move: {
      description: 'Move an item to another position.',
      params: [
        {
          name: 'fromIndex',
          type: 'number',
          description: 'Current position (0 is first).',
        },
        {
          name: 'toIndex',
          type: 'number',
          description: 'New position (0 is first).',
        },
      ],
      returns: 'QueueItem[]',
      run: ({ fromIndex, toIndex }) => {
        requireIndex('fromIndex', fromIndex);
        requireIndex('toIndex', toIndex);
        usePlayerStore
          .getState()
          .reorderQueue(fromIndex as number, toIndex as number);
        return queueItems();
      },
    },
    clear: {
      description: 'Empty the queue.',
      params: [],
      returns: 'QueueItem[]',
      run: () => {
        usePlayerStore.getState().clearQueue();
        return queueItems();
      },
    },
  },
};
