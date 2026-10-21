import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { Input } from '../Input';
import { Toggle } from '../Toggle';
import {
  moveColumn,
  setColumnVisible,
  type CatalogColumn,
  type CatalogTableView,
} from './viewState';

/** Named column layouts (columns, order, widths and sort) the user can save and recall. */
export type CatalogLayoutsApi = {
  names: string[];
  onSave: (name: string) => void;
  onApply: (name: string) => void;
  onDelete: (name: string) => void;
};

export type CatalogTableSettingsLabels = {
  title: string;
  description: string;
  reset: string;
  close: string;
  moveUp: (column: string) => string;
  moveDown: (column: string) => string;
  required: string;
  layoutsTitle: string;
  layoutName: string;
  saveLayout: string;
  applyLayout: (name: string) => string;
  deleteLayout: (name: string) => string;
  noLayouts: string;
  confirmDeleteTitle: string;
  confirmDeleteDescription: (name: string) => string;
  confirmDelete: string;
  cancel: string;
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
  layoutsTitle: 'Saved layouts',
  layoutName: 'Layout name',
  saveLayout: 'Save current layout',
  applyLayout: (name) => `Apply layout ${name}`,
  deleteLayout: (name) => `Delete layout ${name}`,
  noLayouts: 'No saved layouts yet.',
  confirmDeleteTitle: 'Delete this layout?',
  confirmDeleteDescription: (name) =>
    `“${name}” will be removed. Your current columns are not changed.`,
  confirmDelete: 'Delete',
  cancel: 'Cancel',
};

type Props<T> = {
  isOpen: boolean;
  onClose: () => void;
  columns: ReadonlyArray<CatalogColumn<T>>;
  view: CatalogTableView;
  onViewChange: (view: CatalogTableView) => void;
  onReset: () => void;
  layouts?: CatalogLayoutsApi;
  labels?: Partial<CatalogTableSettingsLabels>;
};

export function CatalogTableSettingsDialog<T>({
  isOpen,
  onClose,
  columns,
  view,
  onViewChange,
  onReset,
  layouts,
  labels: labelOverrides,
}: Props<T>) {
  const [layoutName, setLayoutName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const labels = { ...DEFAULT_SETTINGS_LABELS, ...labelOverrides };
  const byId = new Map(columns.map((column) => [column.id, column]));
  const hidden = new Set(view.hidden);
  return (
    <>
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
        {layouts ? (
          <section className="border-border flex flex-col gap-2 border-t pt-3">
            <h3 className="text-sm font-semibold">{labels.layoutsTitle}</h3>
            <div className="flex items-end gap-2">
              <Input
                label={labels.layoutName}
                value={layoutName}
                onChange={(event) => setLayoutName(event.target.value)}
                className="flex-1"
              />
              <Button
                variant="secondary"
                disabled={!layoutName.trim()}
                onClick={() => {
                  layouts.onSave(layoutName.trim());
                  setLayoutName('');
                }}
              >
                {labels.saveLayout}
              </Button>
            </div>
            {layouts.names.length === 0 ? (
              <p className="text-foreground-secondary text-xs">
                {labels.noLayouts}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {layouts.names.map((name) => (
                  <li key={name} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {name}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={labels.applyLayout(name)}
                      onClick={() => layouts.onApply(name)}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="text"
                      intent="danger"
                      aria-label={labels.deleteLayout(name)}
                      onClick={() => setPendingDelete(name)}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
        <Dialog.Actions>
          <Button variant="text" onClick={onReset}>
            {labels.reset}
          </Button>
          <Dialog.Close>{labels.close}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <Dialog.Root
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
      >
        <Dialog.Title>{labels.confirmDeleteTitle}</Dialog.Title>
        <Dialog.Description>
          {labels.confirmDeleteDescription(pendingDelete ?? '')}
        </Dialog.Description>
        <Dialog.Actions>
          <Dialog.Close>{labels.cancel}</Dialog.Close>
          <Button
            intent="danger"
            onClick={() => {
              if (pendingDelete !== null) {
                layouts?.onDelete(pendingDelete);
              }
              setPendingDelete(null);
            }}
          >
            {labels.confirmDelete}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
