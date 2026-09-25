import { CalendarIcon } from 'lucide-react';
import { FC, useState } from 'react';

import { Button } from '../Button';
import { Input } from '../Input';
import { Popover } from '../Popover';
import { Tooltip } from '../Tooltip';
import { useLogViewerContext } from './context';

function toInputValue(d: Date | null): string {
  if (!d) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromInputValue(v: string): Date | null {
  if (!v) {
    return null;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date range narrowing, hidden by default behind a calendar-icon toggle —
 * kept out of the always-visible filter row since it's used far less often
 * than level/scope. */
export const LogDateRangeFilter: FC = () => {
  const { dateRange, setDateRange, labels } = useLogViewerContext();
  const [draftFrom, setDraftFrom] = useState(toInputValue(dateRange.from));
  const [draftTo, setDraftTo] = useState(toInputValue(dateRange.to));

  const active = Boolean(dateRange.from || dateRange.to);

  return (
    <Popover
      className="relative shrink-0"
      anchor="bottom start"
      trigger={
        <Tooltip content={labels.dateRangeButtonLabel} side="top">
          <Button
            type="button"
            variant={active ? 'secondary' : 'text'}
            size="icon-sm"
            aria-label={labels.dateRangeButtonLabel}
            data-testid="log-date-range-toggle"
            onClick={() => {
              setDraftFrom(toInputValue(dateRange.from));
              setDraftTo(toInputValue(dateRange.to));
            }}
          >
            <CalendarIcon className="size-4" />
          </Button>
        </Tooltip>
      }
    >
      <div
        className="flex w-64 flex-col gap-3 p-3"
        data-testid="log-date-range-form"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/60">
            {labels.dateRangeFromLabel}
          </span>
          <Input
            type="datetime-local"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/60">{labels.dateRangeToLabel}</span>
          <Input
            type="datetime-local"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={() => {
              setDraftFrom('');
              setDraftTo('');
              setDateRange({ from: null, to: null });
            }}
          >
            {labels.dateRangeClearButton}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="log-date-range-apply"
            onClick={() =>
              setDateRange({
                from: fromInputValue(draftFrom),
                to: fromInputValue(draftTo),
              })
            }
          >
            {labels.dateRangeApplyButton}
          </Button>
        </div>
      </div>
    </Popover>
  );
};
