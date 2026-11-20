import {
  FileTextIcon,
  HelpCircleIcon,
  HistoryIcon,
  MessagesSquareIcon,
  ScrollTextIcon,
  VoteIcon,
} from 'lucide-react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

export function LoadErrorCaption({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <p className="text-foreground-secondary mb-2 text-xs" role="status">
      {t('adminCoopText.couldNotRefreshList', { message })}{' '}
      <Button
        variant="plain"
        size="flexible"
        className="inline p-0 text-xs underline underline-offset-2"
        onClick={onRetry}
      >
        {t('governanceViewText.retry')}
      </Button>
    </p>
  );
}

export function quickLinks(t: TFunction<'web'>) {
  return [
    {
      to: '/governance/discussions' as const,
      label: t('governanceView.discussions'),
      icon: MessagesSquareIcon,
    },
    {
      to: '/governance/feature-requests' as const,
      label: t('governanceView.featureRequests'),
      icon: VoteIcon,
    },
    {
      to: '/governance/history' as const,
      label: t('governanceView.closedDecisions'),
      icon: HistoryIcon,
    },
    {
      to: '/transparency' as const,
      label: t('governanceView.transparencyLedger'),
      icon: ScrollTextIcon,
    },
    {
      to: '/governance/documents' as const,
      label: t('governanceGuide.documentsTitle'),
      icon: FileTextIcon,
    },
    {
      to: '/governance/guide' as const,
      label: t('governanceView.governanceHelp'),
      icon: HelpCircleIcon,
    },
  ];
}
