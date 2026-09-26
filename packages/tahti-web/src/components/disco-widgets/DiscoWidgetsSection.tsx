import type { DiscoWidgetRenderItem } from '../../api/disco-widgets';
import { PageError } from '../PageStates';
import { DiscoWidgetFrame } from './DiscoWidgetFrame';

/** While loading this renders nothing rather than a spinner: most pages have
 * no widgets, so a placeholder would only flash and shift the layout. */
export function DiscoWidgetsSection({
  widgets,
  status = 'ready',
  onRetry,
}: {
  widgets: DiscoWidgetRenderItem[];
  status?: 'loading' | 'ready' | 'error';
  onRetry?: () => void;
}) {
  if (status === 'error') {
    return <PageError title="Widgets couldn't load" onRetry={onRetry} />;
  }
  if (widgets.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-3">
      {widgets.map((widget) => (
        <DiscoWidgetFrame
          key={widget.installId}
          sandboxUrl={widget.sandboxUrl}
          name={widget.name}
          context={widget.context}
          config={widget.config}
        />
      ))}
    </section>
  );
}
