import { ExternalLinkIcon, GaugeIcon, ServerIcon } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, ButtonAnchor, ButtonLink } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import {
  GRAFANA_BASE_URL,
  GRAFANA_DASHBOARDS,
  grafanaDashboardEmbedUrl,
  grafanaDashboardUrl,
  grafanaExploreLogsUrl,
  grafanaHealthUrl,
  MONITORING_SERVICES,
} from '../../../lib/grafanaMonitoring';

export type GrafanaEmbedState =
  'loading' | 'loaded' | 'timeout' | 'blocked' | 'unreachable';

const EMBED_TIMEOUT_MS = 12_000;
const PROBE_TIMEOUT_MS = 8_000;
const GUARD_BEFORE_LOAD_MS = 15_000;
const GUARD_AFTER_LOAD_MS = 4_000;

function grafanaOrigin(): string {
  try {
    return new URL(GRAFANA_BASE_URL).origin;
  } catch {
    return GRAFANA_BASE_URL;
  }
}

/**
 * A frame's `load` event fires even when the browser blocks it (CSP
 * `frame-src`) or the host is unreachable, because the browser then loads its
 * own error page. So the embed is judged by a CSP violation report and a
 * `no-cors` probe of Grafana's health endpoint instead; `blocked` and
 * `unreachable` win over a later `load`.
 */
export function useGrafanaEmbedState(embedSrc: string) {
  const [state, setState] = useState<GrafanaEmbedState>('loading');

  useEffect(() => {
    setState('loading');
    const origin = grafanaOrigin();
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      const directive = event.effectiveDirective || event.violatedDirective;
      if (
        /^(frame|child)-src/.test(directive) &&
        event.blockedURI.startsWith(origin)
      ) {
        setState('blocked');
      }
    };
    document.addEventListener('securitypolicyviolation', onViolation);

    const controller = new AbortController();
    const probeTimer = window.setTimeout(
      () => controller.abort(),
      PROBE_TIMEOUT_MS,
    );
    let settled = false;
    if (typeof fetch === 'function') {
      fetch(grafanaHealthUrl(), {
        mode: 'no-cors',
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal,
      })
        .catch(() => {
          if (!settled) {
            setState((prev) => (prev === 'blocked' ? prev : 'unreachable'));
          }
        })
        .finally(() => window.clearTimeout(probeTimer));
    }
    const loadTimer = window.setTimeout(() => {
      setState((prev) => (prev === 'loading' ? 'timeout' : prev));
    }, EMBED_TIMEOUT_MS);

    return () => {
      settled = true;
      controller.abort();
      window.clearTimeout(probeTimer);
      window.clearTimeout(loadTimer);
      document.removeEventListener('securitypolicyviolation', onViolation);
    };
  }, [embedSrc]);

  const onLoad = () =>
    setState((prev) =>
      prev === 'loading' || prev === 'timeout' ? 'loaded' : prev,
    );

  return { state, onLoad };
}

function scrollAncestors(node: HTMLElement): HTMLElement[] {
  const found: HTMLElement[] = [];
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
      found.push(el);
    }
  }
  const root = document.scrollingElement;
  if (root instanceof HTMLElement && !found.includes(root)) {
    found.push(root);
  }
  return found;
}

/**
 * Grafana's sign-in page focuses its username field from script, which makes
 * the browser scroll the admin page down to the frame as soon as it loads.
 * For a few seconds after the frame loads, and only until the viewer
 * scrolls, clicks or types on the page, put the page back where it was when
 * focus jumps into the frame. The window is short so a page scroll that
 * chains out of the frame later is left alone.
 */
function useKeepScrollWhenFrameGrabsFocus(
  frameRef: RefObject<HTMLIFrameElement | null>,
) {
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const scrollers = scrollAncestors(frame);
    const startTops = scrollers.map((el) => el.scrollTop);
    let viewerActed = false;
    let guardUntil = Date.now() + GUARD_BEFORE_LOAD_MS;
    const onFrameLoad = () => {
      guardUntil = Date.now() + GUARD_AFTER_LOAD_MS;
    };
    frame.addEventListener('load', onFrameLoad);
    const markActed = () => {
      viewerActed = true;
    };
    const restore = () => {
      if (
        viewerActed ||
        Date.now() > guardUntil ||
        document.activeElement !== frame
      ) {
        return;
      }
      scrollers.forEach((el, index) => {
        const top = startTops[index] ?? 0;
        if (el.scrollTop !== top) {
          el.scrollTop = top;
        }
      });
    };
    const activity = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    for (const type of activity) {
      window.addEventListener(type, markActed, {
        capture: true,
        passive: true,
      });
    }
    document.addEventListener('scroll', restore, {
      capture: true,
      passive: true,
    });
    window.addEventListener('blur', restore);
    return () => {
      for (const type of activity) {
        window.removeEventListener(type, markActed, { capture: true });
      }
      document.removeEventListener('scroll', restore, { capture: true });
      frame.removeEventListener('load', onFrameLoad);
      window.removeEventListener('blur', restore);
    };
  }, [frameRef]);
}

function OpenGrafanaButton({ href }: { href: string }) {
  const { t } = useTranslation('web');
  return (
    <ButtonAnchor
      href={href}
      target="_blank"
      rel="noreferrer"
      size="sm"
      variant="default"
    >
      {t('adminMonitoring.openGrafana')}
      <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
    </ButtonAnchor>
  );
}

export function MonitoringEmbedPanel() {
  const { t } = useTranslation('web');
  const vitalUid = GRAFANA_DASHBOARDS.vital.uid;
  const embedSrc = grafanaDashboardEmbedUrl(vitalUid);
  const vitalHref = grafanaDashboardUrl(vitalUid);
  const { state, onLoad } = useGrafanaEmbedState(embedSrc);
  const host = grafanaOrigin().replace(/^https?:\/\//, '');
  const showFrame = state !== 'blocked' && state !== 'unreachable';
  const frameRef = useRef<HTMLIFrameElement>(null);
  useKeepScrollWhenFrameGrabsFocus(frameRef);

  return (
    <div id="monitoring" className="flex scroll-mt-20 flex-col gap-4">
      <StudioPanel
        title={t('adminMonitoring.grafanaDashboards')}
        icon={GaugeIcon}
        compact
        action={<OpenGrafanaButton href={vitalHref} />}
      >
        <div className="flex flex-wrap gap-2">
          {Object.values(GRAFANA_DASHBOARDS).map((dash) => (
            <ButtonAnchor
              key={dash.uid}
              href={grafanaDashboardUrl(dash.uid)}
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="secondary"
              aria-description={dash.description}
            >
              {dash.title}
              <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
            </ButtonAnchor>
          ))}
          <ButtonAnchor
            href={grafanaExploreLogsUrl()}
            target="_blank"
            rel="noreferrer"
            size="sm"
            variant="secondary"
          >
            {t('adminMonitoring.grafanaExploreLoki')}
            <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
          </ButtonAnchor>
          <ButtonLink
            to="/admin/logs"
            search={{ tab: 'containers' }}
            size="sm"
            variant="text"
          >
            {t('adminMonitoring.fullLogsPage')}
          </ButtonLink>
        </div>
      </StudioPanel>

      <StudioPanel
        title={t('adminMonitoring.vitalServicesGrafana')}
        description={
          showFrame ? t('adminMonitoring.grafanaEmbedsNeedYouSigned') : null
        }
        compact
      >
        {showFrame ? (
          <>
            {state === 'timeout' ? (
              <Alert tone="warning" className="mb-3">
                {t('adminMonitoring.grafanaEmbedDidNotLoad')}
              </Alert>
            ) : null}
            <div className="border-border bg-background-secondary aspect-[4/3] w-full overflow-hidden rounded-md border sm:aspect-[16/10]">
              <iframe
                ref={frameRef}
                title={t('adminMonitoring.tahtiVitalServicesGrafana')}
                src={embedSrc}
                className="h-full w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
                allow="fullscreen"
                data-state={state}
                onLoad={onLoad}
              />
            </div>
            <ButtonAnchor
              href={vitalHref}
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="text"
              className="mt-2 !px-0"
            >
              {t('adminMonitoring.openFullVitalServicesDashboard')}
              <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
            </ButtonAnchor>
          </>
        ) : (
          <div
            data-testid="grafana-embed-fallback"
            className="flex flex-col items-start gap-3"
          >
            <Alert tone="warning">
              {state === 'blocked'
                ? t('adminMonitoring.grafanaEmbedBlocked', { host })
                : t('adminMonitoring.grafanaUnreachable', { host })}
            </Alert>
            <OpenGrafanaButton href={vitalHref} />
          </div>
        )}
      </StudioPanel>

      <StudioPanel
        title={t('adminMonitoring.services')}
        icon={ServerIcon}
        compact
      >
        <ul className="divide-border divide-y">
          {MONITORING_SERVICES.map((svc) => {
            const dash = GRAFANA_DASHBOARDS[svc.grafana.dashboard];
            return (
              <li
                key={svc.id}
                className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 py-1.5 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 basis-40">
                  <div className="font-medium">{svc.label}</div>
                  <div className="text-foreground-secondary text-xs">
                    {svc.description}
                    {svc.grafana.note ? ` · ${svc.grafana.note}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <ButtonAnchor
                    href={grafanaDashboardUrl(dash.uid)}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="secondary"
                  >
                    {dash.title}
                    <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
                  </ButtonAnchor>
                  <ButtonAnchor
                    href={grafanaExploreLogsUrl(svc.logService)}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="text"
                    className="!px-2"
                  >
                    {t('adminMonitoring.grafanaLogs')}
                  </ButtonAnchor>
                  <ButtonLink
                    to="/admin/logs"
                    search={{
                      tab: 'containers',
                      service: svc.logService,
                    }}
                    size="sm"
                    variant="text"
                    className="!px-2"
                  >
                    {t('adminMonitoring.appLogs')}
                  </ButtonLink>
                </div>
              </li>
            );
          })}
        </ul>
      </StudioPanel>
    </div>
  );
}
