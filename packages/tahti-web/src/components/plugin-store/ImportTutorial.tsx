import { useTranslation } from '@tahti-player/i18n';
import { CopyButton } from '@tahti-player/ui';

const CLI_COMMAND = 'tahti hearthis import-embeds';

/** Step-by-step guide at the top of Settings → Add-ons → Import. */
export function ImportTutorial() {
  const { t } = useTranslation('web');
  const steps = [
    t('importTutorial.step1'),
    t('importTutorial.step2'),
    t('importTutorial.step3'),
    t('importTutorial.step4'),
  ];
  return (
    <section
      aria-labelledby="import-tutorial-title"
      data-testid="import-tutorial"
      className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-lg border p-4 text-sm"
    >
      <h3 id="import-tutorial-title" className="text-base font-semibold">
        {t('importTutorial.title')}
      </h3>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="flex flex-col gap-1.5">
        <p className="font-medium">{t('importTutorial.embedsTitle')}</p>
        <p className="text-foreground-secondary">
          {t('importTutorial.embedsBody')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="bg-background border-border rounded border px-2 py-1 font-mono text-xs">
            {CLI_COMMAND}
          </code>
          <CopyButton
            text={CLI_COMMAND}
            toastMessage={t('importTutorial.copied')}
          />
        </div>
      </div>
      <p className="text-foreground-secondary">{t('importTutorial.files')}</p>
    </section>
  );
}
