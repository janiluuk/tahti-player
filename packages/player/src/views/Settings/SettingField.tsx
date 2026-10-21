import { FC } from 'react';

import type {
  EnumSettingDefinition,
  NumberWidget,
  SettingDefinition,
  SettingValue,
} from '@tahti-player/plugin-sdk';
import { Input } from '@tahti-player/ui';

import { CustomWidgetField } from './CustomWidgetField';
import { InfoField } from './InfoField';
import { NumberInputField } from './NumberInputField';
import { SelectField } from './SelectField';
import { SliderField } from './SliderField';
import { ToggleField } from './ToggleField';
import { useSettingTranslation } from './useSettingTranslation';

type SettingFieldProps = {
  definition: SettingDefinition;
  value: SettingValue | undefined;
  setValue: (v: SettingValue) => void;
};

export const SettingField: FC<SettingFieldProps> = ({
  definition,
  value,
  setValue,
}) => {
  if (definition.kind === 'custom') {
    return (
      <CustomWidgetField
        definition={definition}
        value={value}
        setValue={setValue}
      />
    );
  }

  const {
    title: label,
    description,
    translateField,
  } = useSettingTranslation(definition);
  const widgetType = definition.widget?.type;

  const renderers: Record<string, () => JSX.Element> = {
    toggle: () => (
      <ToggleField
        label={label}
        description={description}
        value={Boolean(value)}
        setValue={(v) => setValue(v)}
      />
    ),
    'number-input': () => (
      <NumberInputField
        label={label}
        description={description}
        value={value as number | string | undefined}
        setValue={(v) => setValue(v)}
      />
    ),
    slider: () => {
      const DEFAULT_MIN = 0;
      const DEFAULT_MAX = 100;
      const DEFAULT_STEP = 1;
      const widget = definition.widget as NumberWidget & {
        startLabel?: string;
        endLabel?: string;
      };
      const min = widget?.min ?? DEFAULT_MIN;
      const max = widget?.max ?? DEFAULT_MAX;
      const step = widget?.step ?? DEFAULT_STEP;
      const unit = widget?.unit;
      return (
        <SliderField
          label={label}
          description={description}
          value={Number(value ?? 0)}
          setValue={(v) => setValue(v)}
          min={min}
          max={max}
          step={step}
          unit={unit}
          startLabel={translateField(widget?.startLabel)}
          endLabel={translateField(widget?.endLabel)}
        />
      );
    },
    select: () => (
      <SelectField
        label={label}
        description={description}
        value={String(value ?? '')}
        setValue={(v) => setValue(v)}
        options={
          isEnumDefinition(definition)
            ? definition.options.map((o) => ({ id: o.value, label: o.label }))
            : []
        }
      />
    ),
    radio: () => (
      <SelectField
        label={label}
        description={description}
        value={String(value ?? '')}
        setValue={(v) => setValue(v)}
        options={
          isEnumDefinition(definition)
            ? definition.options.map((o) => ({ id: o.value, label: o.label }))
            : []
        }
      />
    ),
    password: () => (
      <Input
        variant="password"
        label={label}
        description={description}
        value={String(value ?? '')}
        onChange={(e) => setValue(e.target.value)}
      />
    ),
    text: () => (
      <Input
        variant="text"
        label={label}
        description={description}
        value={String(value ?? '')}
        onChange={(e) => setValue(e.target.value)}
      />
    ),
    textarea: () => (
      <Input
        variant="text"
        label={label}
        description={description}
        value={String(value ?? '')}
        onChange={(e) => setValue(e.target.value)}
      />
    ),
    info: () => (
      <InfoField
        label={label}
        description={description}
        value={String(value ?? '')}
      />
    ),
  };

  const renderer = widgetType ? renderers[widgetType] : renderers.text;
  return renderer ? renderer() : null;
};

const isEnumDefinition = (
  def: SettingDefinition,
): def is EnumSettingDefinition => def.kind === 'enum';
