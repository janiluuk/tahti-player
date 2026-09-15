import { LoaderCircleIcon, SaveIcon } from 'lucide-react';
import { ComponentProps, FC } from 'react';

import { Button } from '../Button';

export type SaveButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children'
> & {
  /** Whether a save request is currently in flight. Disables the button and swaps the label. */
  saving?: boolean;
  /** Label shown in the idle state. Defaults to plain "Save" — pass a more specific
   * label (e.g. "Save profile", "Save broadcast") to match what the button persists. */
  label?: string;
  /** Label shown while `saving` is true. */
  savingLabel?: string;
};

/**
 * The app-wide canonical "save this edit" action: a `SaveIcon` plus a label, disabled
 * and re-labelled while the save request is in flight. Use this anywhere a view persists
 * an edit to an existing entity (profile fields, channel settings, a release, etc.) so every
 * save action in the app looks and behaves the same way. Not for creating new entities —
 * those keep their own primary-action button (e.g. a dialog's "Create"/"Publish" button).
 */
export const SaveButton: FC<SaveButtonProps> = ({
  saving = false,
  label = 'Save',
  savingLabel = 'Saving…',
  size = 'sm',
  disabled,
  className,
  ...props
}) => {
  return (
    <Button
      size={size}
      disabled={disabled || saving}
      className={`!bg-accent-orange !text-accent-foreground ${className ?? ''}`}
      {...props}
    >
      {saving ? (
        <LoaderCircleIcon
          size={14}
          aria-hidden
          className="mr-1.5 animate-spin"
        />
      ) : (
        <SaveIcon size={14} aria-hidden className="mr-1.5" />
      )}
      {saving ? savingLabel : label}
    </Button>
  );
};
