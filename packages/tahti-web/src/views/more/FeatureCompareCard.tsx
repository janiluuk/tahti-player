import { Badge } from '@tahti-player/ui';

import { MapCommentForm } from '../../components/MapCommentForm';
import { ParityBadges } from '../../components/ScreenAtlas';
import {
  featureParity,
  isAbsentSurface,
  STATUS_LABEL,
  statusClass,
  type FeatureRow,
} from './features';

export function FeatureCompareCard({ row }: { row: FeatureRow }) {
  const parity = featureParity(row);
  const tahtiAbsent = isAbsentSurface(row.tahti);
  const nuclearAbsent = isAbsentSurface(row.nuclear);

  return (
    <article
      className={`border-border bg-background-secondary/40 overflow-hidden rounded-xl border ${
        parity !== 'both' ? 'ring-accent-yellow/40 ring-1 ring-offset-0' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 p-3 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-sm font-semibold">{row.feature}</h3>
          <span
            className={`inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
          >
            {STATUS_LABEL[row.status]}
          </span>
        </div>
        <ParityBadges parity={parity} />
      </div>
      <div className="border-border grid border-t sm:grid-cols-2">
        <div
          className={`border-border flex min-w-0 flex-col gap-1 border-b p-3 sm:border-r sm:border-b-0 ${
            tahtiAbsent ? 'bg-background-secondary/80' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              Tahti
              <span className="text-foreground-secondary ml-1 font-normal normal-case">
                app.tahti.live
              </span>
            </span>
            {tahtiAbsent ? (
              <Badge variant="pill" color="cyan">
                beta.tahti.live only
              </Badge>
            ) : null}
          </div>
          <p
            className={`font-mono text-xs break-all ${
              tahtiAbsent
                ? 'text-foreground-secondary italic'
                : 'text-foreground-secondary'
            }`}
          >
            {tahtiAbsent ? 'No equivalent' : row.tahti}
          </p>
        </div>
        <div
          className={`flex min-w-0 flex-col gap-1 p-3 ${
            nuclearAbsent ? 'bg-background-secondary/80' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              beta.tahti.live
              <span className="text-foreground-secondary ml-1 font-normal normal-case">
                beta.tahti.live
              </span>
            </span>
            {nuclearAbsent ? (
              <Badge variant="pill" color="orange">
                Tahti only
              </Badge>
            ) : null}
          </div>
          <p
            className={`font-mono text-xs break-all ${
              nuclearAbsent
                ? 'text-foreground-secondary italic'
                : 'text-foreground'
            }`}
          >
            {nuclearAbsent ? 'No equivalent' : row.nuclear}
          </p>
        </div>
      </div>
      {row.notes ? (
        <p className="text-foreground-secondary border-border border-t px-3 py-2 text-xs">
          {row.notes}
        </p>
      ) : null}
      <MapCommentForm
        kind="feature"
        targetId={row.feature}
        title={row.feature}
        feature={row.feature}
        label="Parity comment"
        placeholder={`Comment on “${row.feature}”…`}
        className="border-border flex flex-col gap-2 border-t px-3 py-3"
      />
    </article>
  );
}
