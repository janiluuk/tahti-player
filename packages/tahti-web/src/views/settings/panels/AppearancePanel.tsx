import { FullPlayerTitleTransitionSetting } from './FullPlayerTitleTransitionSetting';
import { LanguagePanel } from './LanguagePanel';
import { ThemesPanel } from './ThemesPanel';

/** Settings → Appearance: the app's language and the full-screen title
 * change above its themes. */
export function AppearancePanel() {
  return (
    <div className="flex flex-col gap-6">
      <LanguagePanel />
      <FullPlayerTitleTransitionSetting />
      <ThemesPanel />
    </div>
  );
}
