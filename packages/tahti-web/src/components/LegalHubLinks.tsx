import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';

import { LEGAL_HUB_LINKS } from '../content/legal';

export function LegalHubLinks() {
  const { t } = useTranslation('web');
  return (
    <nav aria-label={t('legalDocShellText.aboutAndLegal')}>
      <ul className="text-foreground-secondary flex flex-wrap gap-3 text-xs">
        {LEGAL_HUB_LINKS.map((link) => (
          <li key={link.slug}>
            <Link to={link.to} className="underline-offset-2 hover:underline">
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
