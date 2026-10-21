import { useId, useState } from 'react';

import { Button, cn, Select, Slider, Toggle } from '@tahti-player/ui';

import type { ChainEntry } from '../chainTypes';
import {
  getRackEffect,
  RACK_EFFECTS,
  type RackParamDescriptor,
} from '../rackEffects';

export type RackEffectPanelProps = {
  entry: ChainEntry;
  onChangeParams: (params: Record<string, number>) => void;
  onToggleEnabled?: (enabled: boolean) => void;
  className?: string;
};

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: RackParamDescriptor;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const controlId = `${id}-${param.key}`;
  if (
    param.kind === 'toggle' ||
    (param.min === 0 && param.max === 1 && param.step === 1)
  ) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-foreground text-sm" id={controlId}>
          {param.label}
        </span>
        <Toggle
          checked={value >= 0.5}
          onChange={(checked) => onChange(checked ? 1 : 0)}
          aria-labelledby={controlId}
        />
      </div>
    );
  }
  if (param.options && param.options.length > 0) {
    const values =
      param.optionValues ??
      param.options.map((_, i) => param.min + i * param.step);
    return (
      <Select
        id={controlId}
        label={param.label}
        options={param.options.map((label, i) => ({
          id: String(values[i]),
          label,
        }))}
        value={String(value)}
        onValueChange={(next) => onChange(Number(next))}
      />
    );
  }
  return (
    <Slider
      label={`${param.label}${param.unit ? ` (${param.unit})` : ''}`}
      value={value}
      min={param.min}
      max={param.max}
      step={param.step}
      unit={param.unit}
      formatValue={(v) => v.toFixed(3)}
      onValueChange={onChange}
      showFooter={false}
    />
  );
}

export function RackEffectPanel({
  entry,
  onChangeParams,
  onToggleEnabled,
  className,
}: RackEffectPanelProps) {
  const def = getRackEffect(entry.effect);
  if (!def) {
    return (
      <div className={cn('text-foreground-secondary text-sm', className)}>
        Unknown effect: {entry.effect}
      </div>
    );
  }
  const bypassId = useId();
  return (
    <div className={cn('flex flex-col gap-4 p-1', className)}>
      <div className="flex items-center justify-between gap-3">
        <strong className="text-foreground text-sm font-semibold">
          {def.label}
        </strong>
        {onToggleEnabled ? (
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm" id={bypassId}>
              Enabled
            </span>
            <Toggle
              checked={entry.enabled}
              onChange={onToggleEnabled}
              aria-labelledby={bypassId}
            />
          </div>
        ) : null}
      </div>
      {def.description ? (
        <p className="text-foreground-secondary text-sm">{def.description}</p>
      ) : null}
      {def.params.map((param) => (
        <ParamControl
          key={param.key}
          param={param}
          value={entry.params[param.key] ?? param.default}
          onChange={(v) => onChangeParams({ ...entry.params, [param.key]: v })}
        />
      ))}
    </div>
  );
}

export type FxChainListProps = {
  chain: ChainEntry[];
  onSelect?: (entryId: string) => void;
  onAdd?: (effectId: string) => void;
  onRemove?: (entryId: string) => void;
  selectedId?: string | null;
  className?: string;
};

export function FxChainList({
  chain,
  onSelect,
  onAdd,
  onRemove,
  selectedId,
  className,
}: FxChainListProps) {
  const addId = useId();
  const [addKey, setAddKey] = useState(0);
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <ul className="flex flex-col gap-1" role="list" aria-label="Effect chain">
        {chain.map((entry) => {
          const def = getRackEffect(entry.effect);
          const label = def?.label ?? entry.label ?? entry.effect;
          const selected = selectedId === entry.id;
          return (
            <li key={entry.id} className="flex items-center gap-1">
              <Button
                type="button"
                aria-current={selected ? 'true' : undefined}
                size="sm"
                variant={selected ? 'secondary' : 'text'}
                className="min-w-0 flex-1 justify-start"
                onClick={() => onSelect?.(entry.id)}
              >
                {entry.enabled ? label : `${label} (off)`}
              </Button>
              {onRemove ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${label}`}
                  onClick={() => onRemove(entry.id)}
                >
                  ×
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {onAdd ? (
        <Select
          key={addKey}
          id={addId}
          label="Add effect"
          placeholder="Choose…"
          options={RACK_EFFECTS.map((fx) => ({ id: fx.id, label: fx.label }))}
          onValueChange={(effectId) => {
            if (!effectId) {
              return;
            }
            onAdd(effectId);
            setAddKey((n) => n + 1);
          }}
        />
      ) : null}
    </div>
  );
}
