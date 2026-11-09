import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Dialog } from '../Dialog';
import { EditIconButton } from '../EditIconButton';
import { defaultUiLabels, UiLabelsProvider } from './UiLabels';

const finnish = { ...defaultUiLabels, close: 'Sulje', edit: 'Muokkaa' };

describe('UiLabelsProvider', () => {
  it('names the edit button from the provider', () => {
    render(
      <UiLabelsProvider value={finnish}>
        <EditIconButton />
      </UiLabelsProvider>,
    );
    expect(screen.getByRole('button', { name: 'Muokkaa' })).toBeTruthy();
  });

  it('names the dialog close button from the provider', () => {
    render(
      <UiLabelsProvider value={finnish}>
        <Dialog.Root isOpen onClose={() => {}}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Root>
      </UiLabelsProvider>,
    );
    expect(screen.getByTestId('dialog-x-close')).toHaveAttribute(
      'aria-label',
      'Sulje',
    );
  });

  it('falls back to English without a provider', () => {
    render(<EditIconButton />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  });
});
