import { ViewShell } from '@tahti-player/ui';

import { GroupsDirectory } from '../components/GroupsDirectory';

export function GroupsDirectoryView() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-1 py-2">
      <ViewShell
        title="Groups"
        subtitle="Artist collectives with a shared playlist."
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
      >
        <GroupsDirectory />
      </ViewShell>
    </div>
  );
}
