import { FLOW_DIAGRAMS } from '../content/flowDiagrams';
import { MAP_FLOW_GROUPS } from '../content/mapScreens';

/** Flow-aligned atlas: feature text | annotated Nuclear screenshot. */
export function ScreenAtlas() {
  return (
    <section
      className="flex flex-col gap-10"
      aria-labelledby="screen-atlas-heading"
    >
      <div>
        <h2
          id="screen-atlas-heading"
          className="font-display text-2xl font-extrabold tracking-tight"
        >
          Screen atlas
        </h2>
        <p className="text-foreground-secondary mt-1 max-w-3xl text-sm">
          Side-by-side with the{' '}
          <span className="text-foreground font-medium">Planned Nuclear</span>{' '}
          mermaid flows: left = journey step, right = where it lives in the
          current beta client. Screenshots captured from{' '}
          <code className="text-foreground">beta.tahti.live</code> (Nuclear
          chrome — not production e2e).
        </p>
      </div>

      {MAP_FLOW_GROUPS.map((group) => {
        const flow = FLOW_DIAGRAMS.find((d) => d.id === group.flowId);
        return (
          <div key={group.id} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold">{group.title}</h3>
                <p className="text-foreground-secondary text-xs">
                  {group.description}
                </p>
              </div>
              {flow && (
                <p className="text-foreground-secondary font-mono text-[10px]">
                  flow: {flow.title}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-4">
              {group.steps.map((step) => (
                <li key={step.id}>
                  <article className="border-border bg-background-secondary/30 grid overflow-hidden rounded-xl border md:grid-cols-2">
                    {/* Left: feature / flow */}
                    <div className="border-border flex flex-col gap-2 border-b p-4 md:border-r md:border-b-0">
                      <p className="text-foreground-secondary text-[10px] tracking-wide uppercase">
                        Flow step
                      </p>
                      <h4 className="font-display text-base font-bold">
                        {step.title}
                      </h4>
                      <p className="text-primary font-mono text-xs">
                        {step.route}
                      </p>
                      <p className="text-foreground-secondary text-sm leading-relaxed">
                        <span className="text-foreground font-medium">
                          {step.flowStep}
                        </span>
                        <span className="mt-2 block opacity-90">
                          {step.feature}
                        </span>
                      </p>
                      {step.route.includes('$') ? (
                        <span className="text-foreground-secondary mt-auto pt-2 text-[10px] tracking-wide uppercase">
                          Parametric — open from Listen
                        </span>
                      ) : (
                        <a
                          href={step.route}
                          className="text-primary mt-auto pt-2 text-xs font-medium underline-offset-2 hover:underline"
                        >
                          Open in beta →
                        </a>
                      )}
                    </div>

                    {/* Right: annotated screenshot */}
                    <div className="relative bg-background aspect-[16/10] md:aspect-auto md:min-h-[220px]">
                      <img
                        src={step.image}
                        alt={`${step.title} — Nuclear beta`}
                        loading="lazy"
                        className="h-full w-full object-cover object-top"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-10">
                        <p className="text-xs font-semibold text-white">
                          {step.title}
                        </p>
                        <p className="font-mono text-[11px] text-white/80">
                          {step.route}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-white/70">
                          {step.flowStep}
                        </p>
                      </div>
                      <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] tracking-wide text-white/90 uppercase">
                        Nuclear beta
                      </span>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
