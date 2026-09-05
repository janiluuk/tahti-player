import { Check, Download } from 'lucide-react';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';
import { Box } from '../Box';
import { Button } from '../Button';
import { Loader } from '../Loader';

type PluginStoreItemProps = Omit<ComponentProps<'div'>, 'children'> & {
  icon?: ReactNode;
  name: string;
  description: string;
  author: string;
  // TODO: Remove category after registry migration to categories
  category?: string;
  categories?: string[];
  version?: string;
  isInstalled?: boolean;
  isInstalling?: boolean;
  onInstall: () => void;
  /** Extra actions beside the install CTA (toggles, configure, play). */
  accessory?: ReactNode;
  /** Denser row — smaller icon/title/button, no description. For browsing many items in limited space (e.g. a dialog). */
  compact?: boolean;
  labels?: {
    install?: string;
    installing?: string;
    installed?: string;
    by?: string;
  };
};

export const PluginStoreItem: FC<PluginStoreItemProps> = ({
  icon,
  name,
  description,
  author,
  category,
  categories,
  version,
  isInstalled = false,
  isInstalling = false,
  onInstall,
  accessory,
  compact = false,
  labels = {},
  className,
  ...props
}) => {
  const {
    install = 'Install',
    installing = 'Installing',
    installed = 'Installed',
    by = 'by',
  } = labels;
  const buttonSize = compact ? 'sm' : undefined;

  return (
    <Box
      data-testid="plugin-store-item"
      variant="tertiary"
      className={cn(
        'flex-row items-center justify-between',
        compact ? 'gap-2 p-2' : 'gap-4',
        className,
      )}
      {...props}
    >
      {icon && (
        <Box
          variant="tertiary"
          className={cn(
            'shrink-0 items-center justify-center overflow-hidden p-0',
            compact ? 'h-8 w-8' : 'h-12 w-12',
          )}
        >
          {icon}
        </Box>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn(
              'text-foreground inline-flex flex-row items-baseline gap-2 leading-tight font-bold select-none',
              compact ? 'text-sm' : 'text-lg',
            )}
          >
            <span data-testid="plugin-store-item-name">{name}</span>
            {!compact && (
              <p className="text-foreground-secondary text-sm font-normal select-none">
                <span className="mr-1 opacity-60">{by}</span>
                <span data-testid="plugin-store-item-author">{author}</span>
              </p>
            )}
          </h3>
          {version && (
            <Badge
              data-testid="plugin-store-item-version"
              color="inverted"
              variant="pill"
            >
              v{version}
            </Badge>
          )}
          {(categories ?? (category ? [category] : [])).map((cat) => (
            <Badge key={cat} variant="pill" color="cyan">
              {cat}
            </Badge>
          ))}
        </div>
        {!compact && (
          <p
            data-testid="plugin-store-item-description"
            className="text-foreground-secondary line-clamp-2 text-sm"
          >
            {description}
          </p>
        )}
      </div>

      <div
        data-testid="plugin-store-item-actions"
        className="flex shrink-0 items-center gap-2"
      >
        {isInstalling ? (
          <Button
            disabled
            size={buttonSize}
            className={cn(compact ? 'w-20' : 'w-28', 'disabled:opacity-100')}
          >
            <Loader size="sm" />
            <span className="ml-2">{installing}</span>
          </Button>
        ) : isInstalled ? (
          <Button
            disabled
            size={buttonSize}
            className={compact ? 'w-20' : 'w-28'}
          >
            <Check size={compact ? 14 : 16} />
            <span className="ml-2">{installed}</span>
          </Button>
        ) : (
          <Button
            onClick={onInstall}
            size={buttonSize}
            className={compact ? 'w-20' : 'w-28'}
          >
            <Download size={compact ? 14 : 16} />
            <span className="ml-2">{install}</span>
          </Button>
        )}
        {accessory}
      </div>
    </Box>
  );
};
