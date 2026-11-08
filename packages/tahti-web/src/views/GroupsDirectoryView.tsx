import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { GroupsDirectory } from '../components/GroupsDirectory';

export function GroupsDirectoryView() {
  const { t } = useTranslation('web');
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-1 py-2">
      <ViewShell
        title={t('groupsDirectoryView.groups')}
        subtitle={t('groupsDirectoryView.artistCollectivesWithAShared')}
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
      >
        <GroupsDirectory />
      </ViewShell>
    </div>
  );
}
