import { LegalHubLinks } from '../components/LegalHubLinks';
import { PageBackLink } from '../components/PageBackLink';
import { PageHeader } from '../components/PageHeader';
import { PageEmpty } from '../components/PageStates';
import { getLegalPage } from '../content/legal';

const PRODUCTION = 'https://tahti.live';

export function LegalView({ slug }: { slug: string }) {
  const page = getLegalPage(slug);
  if (!page) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <PageEmpty title="Page not found" />
      </div>
    );
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={<PageBackLink to="/what-is-it" label="What is Tahti" />}
        title={page.title}
        subtitle={page.description}
        meta={
          <a
            href={`${PRODUCTION}${page.productionPath}`}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Full page on tahti.live{page.productionPath}
          </a>
        }
      />
      {page.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold tracking-tight">
            {section.heading}
          </h2>
          {section.paragraphs.map((p) => (
            <p
              key={p.slice(0, 48)}
              className="text-foreground-secondary text-sm leading-relaxed"
            >
              {p}
            </p>
          ))}
        </section>
      ))}
      <LegalHubLinks />
    </article>
  );
}
