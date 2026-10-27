import { useState } from 'react';

import {
  Badge,
  Button,
  ExternalLink,
  ImageReveal,
  SegmentedControl,
} from '@tahti-player/ui';

import {
  E2E_RUNS,
  E2E_TRIAGE_LABELS,
  type E2eRun,
  type E2eStatus,
  type E2eTest,
  type E2eTriage,
  type E2eTriageKind,
} from '../content/e2eRuns';
import { PageEmpty } from './PageStates';

type StatusFilter = 'all' | 'failed' | 'passed' | 'triaged';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'failed', label: 'Failed' },
  { id: 'passed', label: 'Passed' },
  { id: 'triaged', label: 'Findings' },
] as const;

const RUN_OPTIONS = E2E_RUNS.map((r) => ({ id: r.id, label: r.label }));

const TRIAGE_COLOR: Record<
  E2eTriageKind,
  'red' | 'orange' | 'yellow' | 'purple' | 'cyan'
> = {
  'app-bug': 'red',
  ux: 'orange',
  'stale-spec': 'yellow',
  blocked: 'purple',
  fixture: 'cyan',
};

function isPass(status: E2eStatus): boolean {
  return status === 'passed';
}

function StatusBadge({ status }: { status: E2eStatus }) {
  if (isPass(status)) {
    return (
      <Badge variant="pill" color="green">
        Passed
      </Badge>
    );
  }
  return (
    <Badge variant="pill" color={status === 'skipped' ? 'secondary' : 'red'}>
      {status === 'timedOut' ? 'Timed out' : status}
    </Badge>
  );
}

function StepStrip({ test }: { test: E2eTest }) {
  if (!test.steps.length) {
    return (
      <PageEmpty
        className="px-4 pb-4"
        title="No screenshots were captured for this test."
      />
    );
  }
  return (
    <ol className="flex gap-3 overflow-x-auto px-4 pb-4">
      {test.steps.map((step, index) => (
        <li
          key={step.image}
          className={`border-border bg-background flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border ${
            step.failed ? 'border-accent-red' : ''
          }`}
        >
          <ExternalLink
            href={step.image}
            aria-label={`Open step ${index + 1} screenshot full size`}
            className="block no-underline"
          >
            <ImageReveal
              src={step.image}
              alt={`Step ${index + 1}: ${step.caption}`}
              className="aspect-[16/10] w-full"
              imgClassName="h-full w-full object-cover object-top"
            />
          </ExternalLink>
          <p className="flex gap-2 px-3 py-2 text-xs leading-snug">
            <span
              className={`font-mono font-semibold ${
                step.failed ? 'text-accent-red-strong' : 'text-primary-strong'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-foreground-secondary min-w-0 break-words">
              {step.caption}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}

function TestCard({
  test,
  triage,
}: {
  test: E2eTest;
  triage: E2eTriage | undefined;
}) {
  const [open, setOpen] = useState(Boolean(triage));
  return (
    <li
      id={`e2e-${test.id}`}
      className="border-border bg-background-secondary/40 rounded-xl border"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={test.status} />
            {triage ? (
              <Badge variant="pill" color={TRIAGE_COLOR[triage.kind]}>
                {E2E_TRIAGE_LABELS[triage.kind]}
              </Badge>
            ) : null}
            <span className="text-foreground-secondary font-mono text-xs">
              {test.file}:{test.line} · {(test.durationMs / 1000).toFixed(1)}s
            </span>
          </div>
          <h4 className="mt-1.5 text-sm font-semibold">{test.title}</h4>
        </div>
        <Button
          size="sm"
          variant="secondary"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Hide steps' : `Show ${test.steps.length} steps`}
        </Button>
      </div>
      {triage ? (
        <p className="border-border border-t px-4 py-2.5 text-sm">
          <span className="text-primary-strong font-semibold">Finding: </span>
          {triage.note}
        </p>
      ) : null}
      {test.error && !isPass(test.status) ? (
        <p className="border-border text-foreground-secondary border-t px-4 py-2.5 font-mono text-xs break-words">
          {test.error}
        </p>
      ) : null}
      {open ? (
        <div className="border-border border-t pt-4">
          <StepStrip test={test} />
        </div>
      ) : null}
    </li>
  );
}

function visibleTests(run: E2eRun, filter: StatusFilter): E2eTest[] {
  switch (filter) {
    case 'failed':
      return run.tests.filter((t) => !isPass(t.status));
    case 'passed':
      return run.tests.filter((t) => isPass(t.status));
    case 'triaged':
      return run.tests.filter((t) => run.triage[t.id]);
    default:
      return run.tests;
  }
}

export function E2eRunGallery() {
  const [runId, setRunId] = useState(E2E_RUNS[0]!.id);
  const [filter, setFilter] = useState<StatusFilter | null>(null);
  const run = E2E_RUNS.find((r) => r.id === runId) ?? E2E_RUNS[0]!;
  const passed = run.tests.filter((t) => isPass(t.status)).length;
  const findings = Object.keys(run.triage).length;
  const activeFilter = filter ?? (findings ? 'triaged' : 'all');
  const tests = visibleTests(run, activeFilter);

  return (
    <section
      id="e2e-runs"
      className="flex scroll-mt-4 flex-col gap-4"
      aria-labelledby="e2e-runs-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            id="e2e-runs-heading"
            className="font-display text-2xl font-extrabold tracking-tight"
          >
            E2E runs
          </h2>
          <p className="text-foreground-secondary mt-1 max-w-3xl text-sm">
            Every Playwright spec in{' '}
            <code className="text-foreground">packages/tahti-web/e2e</code>,
            with a screenshot after each step of the run. Failing steps are
            outlined; specs that surfaced an issue carry a finding note (tracked
            in{' '}
            <code className="text-foreground">
              docs/todo/e2e-run-findings.md
            </code>
            ).
          </p>
        </div>
        <SegmentedControl
          aria-label="E2E run"
          options={RUN_OPTIONS}
          value={runId}
          onChange={setRunId}
        />
      </div>
      <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <p className="text-foreground-secondary max-w-3xl text-sm">
          {run.summary}
        </p>
        <p className="text-foreground-secondary text-xs tracking-wide uppercase">
          {run.capturedAt} · {run.baseUrl} · {passed}/{run.tests.length} passed
          · {findings} finding{findings === 1 ? '' : 's'}
        </p>
      </div>
      <SegmentedControl
        aria-label="Filter E2E tests"
        options={FILTER_OPTIONS}
        value={activeFilter}
        onChange={setFilter}
      />
      {tests.length ? (
        <ul className="flex flex-col gap-3">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} triage={run.triage[test.id]} />
          ))}
        </ul>
      ) : (
        <PageEmpty title="No tests match this filter." />
      )}
    </section>
  );
}
