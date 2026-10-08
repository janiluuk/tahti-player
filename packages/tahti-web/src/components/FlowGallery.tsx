import { useMemo, useState } from 'react';

import { Box, Button } from '@tahti-player/ui';

import {
  FLOW_DIAGRAMS,
  FLOW_PACKS,
  type FlowDiagram,
  type FlowDiagramPack,
} from '../content/flowDiagrams';
import { MapCommentForm } from './MapCommentForm';
import { MermaidDiagram } from './MermaidDiagram';

export function FlowGallery() {
  const [pack, setPack] = useState<FlowDiagramPack>('current');
  const diagrams = useMemo(
    () => FLOW_DIAGRAMS.filter((d) => d.pack === pack),
    [pack],
  );
  const [selectedId, setSelectedId] = useState<string>(
    () =>
      FLOW_DIAGRAMS.find((d) => d.pack === 'current')?.id ??
      FLOW_DIAGRAMS[0]?.id ??
      '',
  );

  const selected: FlowDiagram | undefined =
    diagrams.find((d) => d.id === selectedId) ?? diagrams[0];

  const index = selected
    ? Math.max(
        0,
        diagrams.findIndex((d) => d.id === selected.id),
      )
    : 0;

  function selectPack(next: FlowDiagramPack) {
    setPack(next);
    const first = FLOW_DIAGRAMS.find((d) => d.pack === next);
    if (first) {
      setSelectedId(first.id);
    }
  }

  function step(delta: number) {
    if (!diagrams.length) {
      return;
    }
    const next = diagrams[(index + delta + diagrams.length) % diagrams.length]!;
    setSelectedId(next.id);
  }

  return (
    <section
      id="flow-gallery"
      className="border-border flex flex-col gap-4 rounded-xl border p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            Flow gallery
          </h2>
          <p className="text-foreground-secondary mt-1 max-w-xl text-sm">
            Mermaid journeys aligned with the atlas cases — anonymous, auth,
            listener, artist, and edge gates. Toggle apps/web vs Nuclear.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FLOW_PACKS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={pack === p.id ? 'default' : 'secondary'}
              onClick={() => selectPack(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-foreground-secondary text-xs tracking-wide uppercase">
        {FLOW_PACKS.find((p) => p.id === pack)?.hint} · {diagrams.length}{' '}
        diagrams
      </p>

      <div className="flex flex-col gap-4 lg:flex-row">
        <nav className="border-border flex max-h-64 flex-col gap-1 overflow-y-auto lg:max-h-[28rem] lg:w-64 lg:shrink-0 lg:border-r lg:pr-3">
          {diagrams.map((d, i) => {
            const active = d.id === selected?.id;
            return (
              <Button
                variant="plain"
                size="flexible"
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`inline-block rounded-md px-3 py-2 text-left text-sm whitespace-normal transition-colors active:scale-100 ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                }`}
              >
                <span className="text-foreground-secondary mr-2 text-[10px] font-semibold tracking-wide uppercase">
                  {i + 1}
                </span>
                {d.title}
              </Button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {selected && (
            <>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold">
                    {selected.title}
                  </h3>
                  {selected.blurb && (
                    <p className="text-foreground-secondary mt-1 text-sm">
                      {selected.blurb}
                    </p>
                  )}
                  <p className="text-foreground-secondary mt-1 text-[11px] tracking-wide uppercase">
                    Source {selected.source} · {index + 1} / {diagrams.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => step(-1)}
                    aria-label="Previous diagram"
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => step(1)}
                    aria-label="Next diagram"
                  >
                    Next
                  </Button>
                </div>
              </div>
              <Box variant="tertiary" className="h-auto rounded-lg p-3">
                <MermaidDiagram key={selected.id} chart={selected.mermaid} />
              </Box>
              <MapCommentForm
                kind="flow"
                targetId={selected.id}
                title={selected.title}
                pack={selected.pack}
                label="Flow notes"
                placeholder={`Notes for flow “${selected.title}”…`}
                className="mt-3 flex flex-col gap-2"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
