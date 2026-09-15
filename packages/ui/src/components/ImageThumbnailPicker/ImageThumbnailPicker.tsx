import { FC, ReactNode } from 'react';

import { cn } from '../../utils';

export type ImageThumbnailPickerItem = {
  id: string;
  imageUrl: string;
  /** Shown below the thumbnail in `grid` layout; ignored in `inline`. */
  label?: ReactNode;
  alt?: string;
  /** Overrides the button's accessible name; falls back to `label` (if a
   * plain string) or `id`. */
  ariaLabel?: string;
};

export type ImageThumbnailPickerProps = {
  items: readonly ImageThumbnailPickerItem[];
  selected?: string | null;
  onSelect: (id: string) => void;
  className?: string;
  /**
   * `grid` (default): responsive grid of square tiles with a label under
   * each — for a full picker like admin artwork-preset slots.
   * `inline`: small flex-wrap thumbnails, no label — for a compact
   * "assign from your library" row.
   */
  layout?: 'grid' | 'inline';
  /** Extra tile rendered after the items, e.g. an "upload new" trigger. */
  trailingAction?: ReactNode;
};

export const ImageThumbnailPicker: FC<ImageThumbnailPickerProps> = ({
  items,
  selected,
  onSelect,
  className,
  layout = 'grid',
  trailingAction,
}) => {
  if (layout === 'inline') {
    return (
      <div
        data-testid="image-thumbnail-picker"
        className={cn('flex flex-wrap gap-2', className)}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={selected === item.id}
            aria-label={
              item.ariaLabel ??
              (typeof item.label === 'string' ? item.label : item.id)
            }
            className={cn(
              'size-12 overflow-hidden rounded-md border',
              selected === item.id
                ? 'border-primary ring-primary ring-2'
                : 'border-border',
            )}
          >
            <img
              src={item.imageUrl}
              alt={item.alt ?? ''}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
        {trailingAction}
      </div>
    );
  }

  return (
    <div
      data-testid="image-thumbnail-picker"
      className={cn('grid gap-3 sm:grid-cols-4 lg:grid-cols-8', className)}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          aria-pressed={selected === item.id}
          aria-label={
            item.ariaLabel ??
            (typeof item.label === 'string' ? item.label : item.id)
          }
          className={cn(
            'border-border overflow-hidden rounded-lg border text-left',
            selected === item.id && 'ring-primary ring-2',
          )}
        >
          <img
            src={item.imageUrl}
            alt={item.alt ?? ''}
            className="aspect-square w-full"
          />
          {item.label != null ? (
            <span className="block px-2 py-1 text-xs">{item.label}</span>
          ) : null}
        </button>
      ))}
      {trailingAction}
    </div>
  );
};
