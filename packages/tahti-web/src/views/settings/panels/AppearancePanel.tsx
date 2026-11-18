import { LanguagePanel } from './LanguagePanel';
import { ThemesPanel } from './ThemesPanel';

/** Settings → Appearance: the app's language above its themes. */
export function AppearancePanel() {
  return (
    <div className="flex flex-col gap-6">
      <LanguagePanel />
      <ThemesPanel />
    </div>
  );
}
