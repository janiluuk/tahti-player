// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  HearthisEmbedHostProvider,
  useHearthisEmbedClaim,
  useHearthisEmbedClaimed,
} from './HearthisEmbedHost';

function Probe({ active }: { active: boolean }) {
  useHearthisEmbedClaim(active);
  const claimed = useHearthisEmbedClaimed();
  return <div data-testid="claimed">{claimed ? 'yes' : 'no'}</div>;
}

describe('HearthisEmbedHost', () => {
  afterEach(() => {
    cleanup();
  });

  it('reports claimed while a host is active', () => {
    const { rerender } = render(
      <HearthisEmbedHostProvider>
        <Probe active />
      </HearthisEmbedHostProvider>,
    );
    expect(screen.getByTestId('claimed').textContent).toBe('yes');
    rerender(
      <HearthisEmbedHostProvider>
        <Probe active={false} />
      </HearthisEmbedHostProvider>,
    );
    expect(screen.getByTestId('claimed').textContent).toBe('no');
  });
});
