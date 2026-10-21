import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  ImageThumbnailPicker,
  ImageThumbnailPickerItem,
} from './ImageThumbnailPicker';

const mockItems: ImageThumbnailPickerItem[] = [
  { id: 'hero', imageUrl: 'https://example.com/hero.png', label: 'Hero' },
  {
    id: 'square',
    imageUrl: 'https://example.com/square.png',
    label: 'Square',
  },
];

describe('ImageThumbnailPicker', () => {
  it('(Snapshot) renders grid layout with labels', () => {
    const { container } = render(
      <ImageThumbnailPicker
        items={mockItems}
        selected="hero"
        onSelect={vi.fn()}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('(Snapshot) renders inline layout without labels', () => {
    const { container } = render(
      <ImageThumbnailPicker
        items={mockItems}
        selected="hero"
        onSelect={vi.fn()}
        layout="inline"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('calls onSelect with the clicked item id', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    const { getByRole } = render(
      <ImageThumbnailPicker
        items={mockItems}
        selected="hero"
        onSelect={handleSelect}
      />,
    );

    await user.click(getByRole('button', { name: 'Square' }));
    expect(handleSelect).toHaveBeenCalledWith('square');
  });

  it('marks the selected tile as pressed', () => {
    const { getByRole } = render(
      <ImageThumbnailPicker
        items={mockItems}
        selected="square"
        onSelect={vi.fn()}
      />,
    );
    expect(getByRole('button', { name: 'Square' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(getByRole('button', { name: 'Hero' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('renders a trailing action tile', () => {
    const { getByText } = render(
      <ImageThumbnailPicker
        items={mockItems}
        selected={null}
        onSelect={vi.fn()}
        layout="inline"
        trailingAction={<span>Upload new</span>}
      />,
    );
    expect(getByText('Upload new')).toBeInTheDocument();
  });
});
