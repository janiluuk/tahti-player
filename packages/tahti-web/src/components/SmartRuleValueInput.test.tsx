// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { NativeSmartRule } from '../lib/nativeLibrary';
import { newRule, withField } from './smartPlaylistRules';
import {
  durationToSeconds,
  secondsToDuration,
  SmartRuleValueInput,
} from './SmartRuleValueInput';

const rule = (patch: Partial<NativeSmartRule>): NativeSmartRule => ({
  field: 'genre',
  op: 'is',
  value: '',
  value2: '',
  ...patch,
});

describe('smart rule values', () => {
  it('converts lengths between m:ss and seconds', () => {
    expect(durationToSeconds('3:30')).toBe('210');
    expect(durationToSeconds('0:05')).toBe('5');
    expect(durationToSeconds('210')).toBe('210');
    expect(secondsToDuration('245')).toBe('4:05');
    expect(secondsToDuration('')).toBe('');
  });

  it('uses a date picker for calendar date rules and a number for days', () => {
    const { rerender } = render(
      <SmartRuleValueInput
        rule={rule({ field: 'added', op: 'before' })}
        which="value"
        label="Value"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByLabelText('Date')).toHaveAttribute('type', 'date');
    rerender(
      <SmartRuleValueInput
        rule={rule({ field: 'added', op: 'inLastDays' })}
        which="value"
        label="Value"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByLabelText('Days')).toHaveAttribute('type', 'number');
  });

  it('shows a length as m:ss and hands back seconds', () => {
    const onChange = vi.fn();
    render(
      <SmartRuleValueInput
        rule={rule({ field: 'duration', op: 'atLeast', value: '210' })}
        which="value"
        label="Value"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Length (m:ss)');
    expect(input).toHaveValue('3:30');
    fireEvent.change(input, { target: { value: '4:05' } });
    expect(onChange).toHaveBeenCalledWith('245');
  });

  it('starts picker-only fields with a valid value', () => {
    expect(newRule('rating').value).toBe('4');
    expect(withField(rule({ value: 'house' }), 'key')).toMatchObject({
      field: 'key',
      value: 'C',
    });
    expect(withField(rule({ value: 'house' }), 'genre').value).toBe('house');
  });
});
