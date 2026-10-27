import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { MikseriSidebarWidget } from './MikseriSidebarWidget';

describe('MikseriSidebarWidget', () => {
  beforeEach(() => {
    useListenerWidgetsStore.setState({ instances: [] });
  });

  it('waits for consent before loading the third-party iframe', () => {
    useListenerWidgetsStore.setState({
      instances: [
        {
          id: 'm1',
          typeId: 'mikseri',
          input: 'https://www.mikseri.net/embed/?type=15&parameter=0',
          label: 'Mikseri Listataivas',
          addedAt: '2026-10-27T00:00:00.000Z',
        },
      ],
    });
    render(<MikseriSidebarWidget />);
    expect(screen.queryByTitle('Mikseri Listataivas')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Load player' }));
    expect(screen.getByTitle('Mikseri Listataivas')).toBeTruthy();
  });

  it('does not render without a configured Mikseri widget', () => {
    const { container } = render(<MikseriSidebarWidget />);
    expect(container).toBeEmptyDOMElement();
  });
});
