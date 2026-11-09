import { LanguagesIcon } from 'lucide-react';

import { SegmentedControl } from '@tahti-player/ui';

import {
  setContentLocale,
  useContentLocale,
  type ContentLocale,
} from '../lib/contentLocale';

const OPTIONS: Array<{ id: ContentLocale; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'fi', label: 'Suomi' },
];

export function ContentLanguageToggle({ className }: { className?: string }) {
  const locale = useContentLocale();
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <LanguagesIcon
        size={16}
        aria-hidden
        className="text-foreground-secondary"
      />
      <SegmentedControl
        aria-label={locale === 'fi' ? 'Kieli' : 'Language'}
        options={OPTIONS}
        value={locale}
        onChange={(next) => void setContentLocale(next)}
      />
    </div>
  );
}
