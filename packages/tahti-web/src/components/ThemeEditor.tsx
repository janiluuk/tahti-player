import { ChevronDownIcon, FileJson, XIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  applyAdvancedTheme,
  clearAdvancedTheme,
  type AdvancedTheme,
} from '@tahti-player/themes';
import {
  Box,
  Button,
  Dialog,
  Input,
  Slider,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import { useThemeStore } from '../plugins/themes';

type VarField = { key: string; label: string };

type VarGroup = {
  id: string;
  title: string;
  fields: VarField[];
};

const VAR_GROUPS: VarGroup[] = [
  {
    id: 'surfaces',
    title: 'Surfaces',
    fields: [
      { key: 'background', label: 'Background' },
      { key: 'background-secondary', label: 'Secondary' },
      { key: 'border', label: 'Border' },
    ],
  },
  {
    id: 'text',
    title: 'Text',
    fields: [
      { key: 'foreground', label: 'Primary' },
      { key: 'foreground-secondary', label: 'Secondary' },
    ],
  },
  {
    id: 'brand',
    title: 'Brand',
    fields: [
      { key: 'primary', label: 'Primary' },
      { key: 'primary-foreground', label: 'On primary' },
      { key: 'secondary', label: 'Secondary' },
      { key: 'secondary-foreground', label: 'On secondary' },
    ],
  },
  {
    id: 'accents',
    title: 'Accents',
    fields: [
      { key: 'accent-green', label: 'Green' },
      { key: 'accent-yellow', label: 'Yellow' },
      { key: 'accent-purple', label: 'Purple' },
      { key: 'accent-blue', label: 'Blue' },
      { key: 'accent-orange', label: 'Orange' },
      { key: 'accent-cyan', label: 'Cyan' },
      { key: 'accent-red', label: 'Red' },
    ],
  },
];

function currentValue(key: string): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${key}`)
    .trim();
}

function nonEmpty(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim() !== ''),
  );
}

function colorToHex(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split('')
      .map((part) => part + part)
      .join('')}`;
  }
  if (typeof document === 'undefined') {
    return '#888888';
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return '#888888';
  }
  context.fillStyle = '#888888';
  context.fillStyle = trimmed;
  const [red, green, blue] = context.fillStyle.match(/\d+/g)?.map(Number) ?? [];
  if ([red, green, blue].some((channel) => channel === undefined)) {
    return '#888888';
  }
  return `#${[red, green, blue]
    .map((channel) => channel!.toString(16).padStart(2, '0'))
    .join('')}`;
}

function hexToHsl(value: string): [number, number, number] {
  const hex = colorToHex(value).slice(1);
  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) {
    return [0, 0, lightness];
  }
  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue =
    ((max === red
      ? (green - blue) / delta + (green < blue ? 6 : 0)
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4) /
      6) *
    360;
  return [hue, saturation, lightness];
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const offset = lightness - chroma / 2;
  return `#${match
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

type ColorTokenRowProps = {
  field: VarField;
  value: string;
  placeholder: string;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onChange: (next: string) => void;
  onClear: () => void;
};

function ColorTokenRow({
  field,
  value,
  placeholder,
  expanded,
  onExpand,
  onCollapse,
  onChange,
  onClear,
}: ColorTokenRowProps) {
  const display = value || placeholder;
  const [hue, saturation, lightness] = hexToHsl(display);
  const overridden = value.trim() !== '';

  return (
    <div
      className="border-border rounded-md border"
      data-testid={`theme-editor-token-${field.key}`}
    >
      <button
        type="button"
        className="hover:bg-background-secondary/60 flex w-full items-center gap-2 px-2 py-1.5 text-left"
        aria-expanded={expanded}
        onClick={() => (expanded ? onCollapse() : onExpand())}
      >
        <span
          className="border-border size-6 shrink-0 rounded border"
          style={{ background: display }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {field.label}
        </span>
        {overridden ? (
          <span className="text-foreground-secondary font-mono text-[10px] uppercase">
            edit
          </span>
        ) : null}
        <ChevronDownIcon
          size={14}
          aria-hidden
          className={`text-foreground-secondary shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expanded ? (
        <div className="border-border flex flex-col gap-2 border-t px-2 py-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorToHex(display)}
              onChange={(event) => onChange(event.target.value)}
              className="border-border size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              aria-label={`Pick ${field.label}`}
            />
            <Input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              aria-label={`${field.label} CSS color`}
              className="font-mono text-xs"
            />
            {overridden ? (
              <Tooltip content={`Clear ${field.label} override`} side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Clear ${field.label} override`}
                  onClick={onClear}
                >
                  <XIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
            ) : null}
          </div>
          <Slider
            label="Hue"
            value={hue}
            min={0}
            max={360}
            step={1}
            unit="°"
            showFooter={false}
            onValueChange={(next) =>
              onChange(hslToHex(next, saturation, lightness))
            }
          />
          <Slider
            label="Saturation"
            value={Math.round(saturation * 100)}
            min={0}
            max={100}
            step={1}
            unit="%"
            showFooter={false}
            onValueChange={(next) =>
              onChange(hslToHex(hue, next / 100, lightness))
            }
          />
          <Slider
            label="Lightness"
            value={Math.round(lightness * 100)}
            min={0}
            max={100}
            step={1}
            unit="%"
            showFooter={false}
            onValueChange={(next) =>
              onChange(hslToHex(hue, saturation, next / 100))
            }
          />
        </div>
      ) : null}
    </div>
  );
}

/** Compact custom-theme editor. Token swatches stay collapsed; click one to
 * reveal Storybook Slider HSL controls. Light/dark variant follows the
 * Settings → Themes appearance row (`ThemeController`), not a local toggle. */
export function ThemeEditor() {
  const dark = useThemeStore((state) => state.dark);
  const importCustomTheme = useThemeStore((state) => state.importCustomTheme);

  const [name, setName] = useState('My theme');
  const [lightValues, setLightValues] = useState<Record<string, string>>({});
  const [darkValues, setDarkValues] = useState<Record<string, string>>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const activeValues = dark ? darkValues : lightValues;
  const setActiveValues = dark ? setDarkValues : setLightValues;

  const draft: AdvancedTheme = useMemo(
    () => ({
      version: 1,
      name: name.trim() || 'Draft',
      vars: nonEmpty(lightValues),
      dark: nonEmpty(darkValues),
    }),
    [name, lightValues, darkValues],
  );

  useEffect(() => {
    applyAdvancedTheme(draft);
  }, [draft]);

  useEffect(() => clearAdvancedTheme, []);

  useEffect(() => {
    setExpandedKey(null);
  }, [dark]);

  const save = () => {
    const result = importCustomTheme(draft);
    setSaveMsg(result.ok ? 'Saved and applied.' : result.error);
  };

  const importTheme = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importJson);
    } catch {
      setImportMsg('Not valid JSON.');
      return;
    }
    const result = importCustomTheme(parsed);
    if (!result.ok) {
      setImportMsg(result.error);
      return;
    }
    setImportMsg('Theme imported and applied.');
    setImportJson('');
    setImportOpen(false);
  };

  return (
    <div
      className="flex max-h-[min(70vh,36rem)] flex-col gap-3"
      data-testid="theme-editor"
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <Button size="sm" onClick={save}>
          Save
        </Button>
        <Tooltip content="Import theme JSON" side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="Import theme JSON"
            onClick={() => setImportOpen(true)}
          >
            <FileJson size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      <p className="text-foreground-secondary text-xs">
        Editing the <strong>{dark ? 'dark' : 'light'}</strong> variant. Use the
        sun/moon control above to switch. Click a color to tune it — blank keeps
        the base palette.
      </p>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {VAR_GROUPS.map((group) => (
          <Box
            key={group.id}
            variant="tertiary"
            shadow="none"
            className="flex-col gap-2 !p-2"
            data-testid={`theme-editor-group-${group.id}`}
          >
            <h3 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
              {group.title}
            </h3>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {group.fields.map((field) => (
                <ColorTokenRow
                  key={field.key}
                  field={field}
                  value={activeValues[field.key] ?? ''}
                  placeholder={currentValue(field.key)}
                  expanded={expandedKey === field.key}
                  onExpand={() => setExpandedKey(field.key)}
                  onCollapse={() => setExpandedKey(null)}
                  onChange={(next) =>
                    setActiveValues((prev) => ({
                      ...prev,
                      [field.key]: next,
                    }))
                  }
                  onClear={() =>
                    setActiveValues((prev) => {
                      const next = { ...prev };
                      delete next[field.key];
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </Box>
        ))}
      </div>

      {saveMsg ? (
        <span className="text-foreground-secondary text-xs" role="status">
          {saveMsg}
        </span>
      ) : null}

      <Dialog.Root
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        className="max-w-xl"
      >
        <Dialog.Title>Import theme JSON</Dialog.Title>
        <Dialog.Description>
          Paste a version 1 theme. It is validated before being added to your
          library.
        </Dialog.Description>
        <Textarea
          tone="secondary"
          value={importJson}
          onChange={(event) => {
            setImportJson(event.target.value);
            setImportMsg(null);
          }}
          rows={10}
          className="font-mono text-xs"
          placeholder={
            '{\n  "version": 1,\n  "name": "My theme",\n  "vars": {}\n}'
          }
          aria-label="Theme JSON"
        />
        {importMsg ? (
          <p className="text-accent-red text-xs">{importMsg}</p>
        ) : null}
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button onClick={importTheme} disabled={!importJson.trim()}>
            Import and apply
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </div>
  );
}
