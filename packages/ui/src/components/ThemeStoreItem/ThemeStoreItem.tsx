import { Check, Download, Paintbrush, Trash } from 'lucide-react';
import { FC, type ReactNode } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';
import { Box } from '../Box';
import { Button } from '../Button';
import { Loader } from '../Loader';
import { usePluginCategories } from '../PluginCategoryContext';
import { Tooltip } from '../Tooltip';

type ThemeStoreItemProps = {
  name: string;
  description: string;
  author: string;
  palette: [string, string, string, string];
  tags?: string[];
  isInstalled?: boolean;
  isInstalling?: boolean;
  isActive?: boolean;
  onInstall: () => void;
  onApply?: () => void;
  onUninstall?: () => void;
  /** Extra actions beside apply/uninstall (configure, rename, export). */
  accessory?: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  labels?: {
    install?: string;
    installing?: string;
    installed?: string;
    apply?: string;
    active?: string;
    uninstall?: string;
    by?: string;
  };
  className?: string;
};

export const ThemeStoreItem: FC<ThemeStoreItemProps> = ({
  name,
  description,
  author,
  palette,
  tags: suppliedTags,
  isInstalled = false,
  isInstalling = false,
  isActive = false,
  onInstall,
  onApply,
  onUninstall,
  accessory,
  onMouseEnter,
  onMouseLeave,
  labels = {},
  className,
}) => {
  const tags = usePluginCategories(suppliedTags);
  const {
    install = 'Install',
    installing = 'Installing',
    installed = 'Installed',
    apply = 'Apply',
    active = 'Active',
    uninstall = 'Remove',
    by = 'by',
  } = labels;

  const showInstallButton = !isInstalled || isInstalling;
  const actionIcons =
    (isInstalled && (onApply || onUninstall)) || accessory ? (
      <div className="flex shrink-0 items-center gap-1">
        {isInstalled && onApply ? (
          <Tooltip content={isActive ? active : apply}>
            <Button
              size="icon-sm"
              disabled={isActive}
              onClick={onApply}
              data-testid="theme-store-item-apply"
              aria-label={isActive ? active : apply}
            >
              {isActive ? <Check size={16} /> : <Paintbrush size={16} />}
            </Button>
          </Tooltip>
        ) : null}
        {accessory}
        {isInstalled && onUninstall ? (
          <Tooltip content={uninstall}>
            <Button
              size="icon-sm"
              intent="danger"
              onClick={onUninstall}
              data-testid="theme-store-item-uninstall"
              aria-label={uninstall}
            >
              <Trash size={16} />
            </Button>
          </Tooltip>
        ) : null}
      </div>
    ) : null;

  return (
    <div data-testid="theme-store-item" className={cn('flex', className)}>
      <Box
        variant="tertiary"
        className="relative h-auto min-w-0 flex-1 overflow-hidden p-1.5"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="absolute inset-0 flex">
          {palette.map((color, index) => (
            <div
              key={index}
              className="-mx-4 flex-1 scale-y-110 -skew-x-12 first:-ml-8 last:-mr-8"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Box
          variant="tertiary"
          shadow="none"
          className="relative flex-1 flex-row items-center justify-between gap-2 !p-2"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3
                data-testid="theme-store-item-name"
                className="text-foreground truncate text-sm font-bold"
              >
                {name}
              </h3>
              <p
                data-testid="theme-store-item-author"
                className="text-foreground-secondary truncate text-xs"
              >
                {by} {author}
              </p>
              {tags?.map((tag) => (
                <Badge key={tag} variant="pill" color="cyan">
                  {tag}
                </Badge>
              ))}
            </div>
            <p
              data-testid="theme-store-item-description"
              className="text-foreground-secondary line-clamp-1 text-xs"
            >
              {description}
            </p>
          </div>
          {showInstallButton ? (
            <div className="shrink-0">
              {isInstalling ? (
                <Button disabled size="sm" className="min-w-24">
                  <Loader size="sm" />
                  <span className="ml-2">{installing}</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onInstall}
                  className="min-w-24"
                  data-testid="theme-store-item-install"
                >
                  <Download size={16} />
                  <span className="ml-2">{install}</span>
                </Button>
              )}
            </div>
          ) : actionIcons ? (
            actionIcons
          ) : (
            <Tooltip content={installed}>
              <Button
                size="icon-sm"
                disabled
                aria-label={installed}
                data-testid="theme-store-item-installed"
              >
                <Check size={16} />
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    </div>
  );
};
