import { createContext } from 'react';

/** How a `Card` draws itself: the usual fixed-width tile, a compact list row
 * (artwork thumbnail, title, subtitle) or a tile as wide as its container.
 * `CardsRow` sets it for the cards it renders. */
export type CardLayout = 'card' | 'row' | 'full';

export const CardLayoutContext = createContext<CardLayout>('card');
