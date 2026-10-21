import mermaid from 'mermaid';
import { describe, expect, it } from 'vitest';

import { FLOW_DIAGRAMS } from './flowDiagrams';
import { caseFlowchart, MAP_CASES } from './mapScreens';

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });

describe('Tahti map Mermaid graphs', () => {
  it('gives every flow diagram a unique id', () => {
    const ids = FLOW_DIAGRAMS.map((diagram) => diagram.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every map case a unique id', () => {
    const ids = MAP_CASES.map((mapCase) => mapCase.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(FLOW_DIAGRAMS.map((diagram) => [diagram.id, diagram.mermaid]))(
    'parses flow diagram %s',
    async (_id, chart) => {
      await expect(mermaid.parse(chart)).resolves.toBeTruthy();
    },
  );

  it.each(MAP_CASES.map((mapCase) => [mapCase.id, caseFlowchart(mapCase)]))(
    'parses the per-screen graph for %s',
    async (_id, chart) => {
      await expect(mermaid.parse(chart)).resolves.toBeTruthy();
    },
  );
});
