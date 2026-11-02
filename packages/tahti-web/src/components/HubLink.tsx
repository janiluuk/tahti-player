import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

export function renderHubLink(
  href: string,
  children: ReactNode,
  className: string,
) {
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}
