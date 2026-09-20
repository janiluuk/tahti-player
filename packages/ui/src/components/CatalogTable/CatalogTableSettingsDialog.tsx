import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { Toggle } from '../Toggle';
import {
  moveColumn,
  setColumnVisible,
  type CatalogColumn,
  type CatalogTableView,
} from './viewState';

export type CatalogTableSettingsLabels = {
  title: string;
  description: string;
  reset: string;
  close: string;
  moveUp: (column: string) => string;
  moveDown: (column: string) => string;
  required: string;
};

export const DEFAULT_SETTINGS_LABELS: CatalogTableSettingsLabels = {
  title: 'Table settings',
  description:
    'Choose which fields the table shows and in what order. Saved on this device.',
  reset: 'Reset to defaults',
  close: 'Done',
  moveUp: (column) => `Move ${column} up`,
  moveDown: (column) => `Move ${column} down`,
  required: 'Always shown',
};

type Props<T> = {
  isOpen: boolean;
  onClose: () => void;
  columns: ReadonlyArray<CatalogColumn<T>>;
  view: CatalogTableView;
  onViewChange: (view: CatalogTableView) => void;
  onReset: () => void;
  labels?: Partial<CatalogTableSettingsLabels>;
};

export function CatalogTableSettingsDialog<T>({
  isOpen,
  onClose,
  columns,
  view,
  onViewChange,
  onReset,
  labels: labelOverrides,
}: Props<T>) {
  const labels = { ...DEFAULT_SETTINGS_LABELS, ...labelOverrides };
  const byId = new Map(columns.map((column) => [column.id, column]));
  const hidden = new Set(view.hidden);
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Title>{labels.title}</Dialog.Title>
      <Dialog.Description>{labels.description}</Dialog.Description>
      <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto py-2">
        {view.order.map((id, index) => {
          const column = byId.get(id);
          if (!column) {
            return null;
          }
          const visible = column.required || !hidden.has(id);
          return (
            <li
              key={id}
              className="border-border flex items-center gap-2 rounded-md border px-2 py-1"
            >
              <Toggle
                checked={visible}
                disabled={column.required}
                onChange={(checked) =>
                  onViewChange(setColumnVisible(view, id, checked))
                }
                aria-label={`Show ${column.header}`}
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {column.header}
                {column.required ? (
                  <span className="text-foreground-secondary ml-2 text-xs">
                    {labels.required}
                  </span>
                ) : null}
              </span>
              <Button
                size="icon-sm"
                variant="text"
                aria-label={labels.moveUp(column.header)}
                disabled={index === 0}
                onClick={() => onViewChange(moveColumn(view, id, -1))}
              >
                <ChevronUpIcon size={14} aria-hidden />
              </Button>
              <Button
                size="icon-sm"
                variant="text"
                aria-label={labels.moveDown(column.header)}
                disabled={index === view.order.length - 1}
                onClick={() => onViewChange(moveColumn(view, id, 1))}
              >
                <ChevronDownIcon size={14} aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      <Dialog.Actions>
        <Button variant="text" onClick={onReset}>
          {labels.reset}
        </Button>
        <Dialog.Close>{labels.close}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
