// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { HelpLayer } from './HelpLayer';

function renderHelpLayer(defaultOpen?: boolean): {
  container: HTMLDivElement;
  root: Root;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <HelpLayer title="Help for this section" defaultOpen={defaultOpen}>
        <p>Explanation goes here.</p>
      </HelpLayer>,
    );
  });
  return { container, root };
}

describe('HelpLayer', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('starts collapsed and reveals its content on click', () => {
    const { container } = renderHelpLayer();
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toBe('Help for this section');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('[role="region"]')).toBeNull();

    act(() => {
      button.click();
    });

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.textContent).toBe('Hide help');
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe('Explanation goes here.');
  });

  it('supports starting open via defaultOpen', () => {
    const { container } = renderHelpLayer(true);
    expect(container.querySelector('[role="region"]')).not.toBeNull();
  });
});
