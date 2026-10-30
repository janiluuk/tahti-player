import { fireEvent, screen } from '@testing-library/react';

import { useTrackListViewStore } from '../stores/trackListViewStore';

/** Forgets the remembered listing view; the store outlives one test. */
export function resetTrackListView() {
  useTrackListViewStore.setState({ view: null });
}

/** Opens a listing's Track size popover and picks `name` (e.g. 'Grid'). */
export function pickTrackView(name: string) {
  fireEvent.click(screen.getByRole('button', { name: /^Track size/ }));
  fireEvent.click(screen.getByRole('menuitemradio', { name }));
}
