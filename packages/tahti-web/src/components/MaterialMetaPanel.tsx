import type { ReactNode } from 'react';

/** Card shell for material metadata widgets (Tags, Genre) — red icon tile,
 * title, optional description, then the field body. */
export function MaterialMetaPanel({
  icon,
  title,
  description,
  children,
  className = '',
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-border bg-background rounded-xl border p-4 sm:p-5 ${className}`}
    >
      <header className="mb-4">
        <h3 className="text-foreground flex items-center gap-2.5 text-base font-bold tracking-tight">
          <span
            className="bg-accent-red flex size-6 shrink-0 items-center justify-center rounded-md text-white"
            aria-hidden
          >
            {icon}
          </span>
          {title}
        </h3>
        {description ? (
          <p className="text-foreground-secondary mt-1.5 text-sm leading-snug">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
