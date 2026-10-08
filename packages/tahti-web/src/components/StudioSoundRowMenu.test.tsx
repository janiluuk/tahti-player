// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StudioSound } from '../api/studio-types';
import { StudioSoundRowMenu } from './StudioSoundRowMenu';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));

afterEach(cleanup);

describe('StudioSoundRowMenu', () => {
  it('makes the More button the menu trigger', () => {
    render(
      <StudioSoundRowMenu
        item={{ id: 's1', title: 'Late Session' } as StudioSound}
        busy={false}
        hasEmbed={false}
        onTogglePin={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', {
      name: 'More actions for Late Session',
    });
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
  });
});
