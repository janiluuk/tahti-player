// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { ListenerWorldMap } from './ListenerWorldMap';

function renderMap(ui: ReactElement): {
  container: HTMLDivElement;
  root: Root;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('ListenerWorldMap', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  it('renders accurate country paths and listener ranking', () => {
    const rendered = renderMap(
      <ListenerWorldMap
        data={[
          { countryCode: 'FI', displayName: 'Finland', count: 120 },
          { countryCode: 'US', displayName: 'United States', count: 40 },
        ]}
      />,
    );
    root = rendered.root;
    container = rendered.container;

    expect(
      container.querySelector('[aria-label="Listener world map"]'),
    ).toBeTruthy();
    expect(container.textContent).toContain('Finland');
    expect(container.textContent).toContain('United States');
    expect(container.querySelectorAll('svg path').length).toBeGreaterThan(100);
  });

  it('shows empty copy when there is no geo data', () => {
    const rendered = renderMap(<ListenerWorldMap data={[]} />);
    root = rendered.root;
    container = rendered.container;
    expect(container.textContent).toContain('No listener location data yet.');
  });
});
