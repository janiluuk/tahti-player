import { Moon, Sun } from 'lucide-react';
import { FC, useEffect } from 'react';

import { cn } from '../../utils';
import { Toggle } from '../Toggle/Toggle';

type ThemeControllerProps = {
  isDark?: boolean;
  defaultIsDark?: boolean;
  onThemeChange?: (isDark: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Show "Light" / "Dark" text either side of the switch — for a
   * settings-page appearance row with room to spare. Off by default so
   * compact placements (a top bar icon strip) don't grow text. */
  showLabels?: boolean;
};

const ICON_SIZE = 12;

export const ThemeController: FC<ThemeControllerProps> = ({
  isDark,
  defaultIsDark = false,
  onThemeChange,
  disabled,
  className,
  showLabels = false,
}) => {
  const handleThemeChange = (newIsDark: boolean) => {
    if (newIsDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    onThemeChange?.(newIsDark);
  };

  useEffect(() => {
    if (isDark !== undefined) {
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, [isDark]);

  const toggle = (
    <Toggle
      checked={isDark}
      defaultChecked={defaultIsDark}
      onChange={handleThemeChange}
      disabled={disabled}
      className={showLabels ? undefined : className}
      label="Toggle theme"
      thumbIcon={<Sun size={ICON_SIZE} className="text-foreground" />}
      checkedThumbIcon={<Moon size={ICON_SIZE} className="text-foreground" />}
    />
  );

  if (!showLabels) {
    return toggle;
  }

  const activeIsDark = isDark ?? defaultIsDark;
  return (
    <div className={cn('inline-flex items-center gap-2 text-sm', className)}>
      <span
        className={cn(
          activeIsDark
            ? 'text-foreground-secondary'
            : 'text-foreground font-medium',
        )}
      >
        Light
      </span>
      {toggle}
      <span
        className={cn(
          activeIsDark
            ? 'text-foreground font-medium'
            : 'text-foreground-secondary',
        )}
      >
        Dark
      </span>
    </div>
  );
};
