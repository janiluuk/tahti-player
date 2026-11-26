import { FullPlayerTitleTransitionSetting } from './FullPlayerTitleTransitionSetting';
import { LanguagePanel } from './LanguagePanel';

export function GeneralPanel() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <LanguagePanel />
      <FullPlayerTitleTransitionSetting />
    </div>
  );
}
