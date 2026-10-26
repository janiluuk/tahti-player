import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useNavigationStructureStore } from '../stores/navigationStructureStore';
import { NavigationStructureWidget } from './NavigationStructureWidget';

describe('NavigationStructureWidget', () => {
  beforeEach(() => {
    useNavigationStructureStore.setState({
      items: [{ id: 'one', label: 'One', path: '/one' }],
    });
  });

  it('adds a top-level item when the add form is submitted', () => {
    render(<NavigationStructureWidget />);
    const label = screen.getByLabelText('Label');

    fireEvent.change(label, { target: { value: 'Community' } });
    fireEvent.change(screen.getByLabelText('Path'), {
      target: { value: '/community' },
    });
    fireEvent.submit(label.closest('form') as HTMLFormElement);

    const list = screen.getByRole('list', {
      name: 'Navigation structure draft',
    });
    expect(within(list).getByText('Community')).toBeInTheDocument();
    expect(label).toHaveValue('');
  });

  it('makes Add top-level item the form submit button', () => {
    render(<NavigationStructureWidget />);

    expect(
      screen.getByRole('button', { name: 'Add top-level item' }),
    ).toHaveAttribute('type', 'submit');
  });
});
