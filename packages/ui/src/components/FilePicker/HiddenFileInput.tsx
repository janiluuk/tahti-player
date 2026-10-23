import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '../../utils';

export type HiddenFileInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'children' | 'onChange' | 'type'
> & {
  /** Called with the chosen files; the input is reset so picking the same
   * file again still fires. */
  onFiles: (files: File[]) => void;
};

/** Invisible file input for custom controls (an image slot, a toolbar
 * button) that open the OS picker via `ref.current.click()`. Use
 * `FilePicker` when a visible labelled dropzone fits. */
export const HiddenFileInput = forwardRef<
  HTMLInputElement,
  HiddenFileInputProps
>(function HiddenFileInput({ onFiles, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      type="file"
      tabIndex={-1}
      aria-hidden
      data-testid="hidden-file-input"
      className={cn('sr-only', className)}
      {...rest}
      onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = '';
        if (files.length > 0) {
          onFiles(files);
        }
      }}
    />
  );
});
