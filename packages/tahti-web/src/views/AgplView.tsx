import { ExternalLink } from '@tahti-player/ui';

import { LegalDocSection, LegalDocShell } from '../components/LegalDocShell';

const p = 'text-foreground-secondary text-sm leading-relaxed';
const ul = 'text-foreground-secondary list-disc space-y-1 pl-5 text-sm';
const ol = 'text-foreground-secondary list-decimal space-y-1 pl-5 text-sm';
const link = 'no-underline underline-offset-2 hover:underline';

export function AgplView() {
  return (
    <LegalDocShell
      title="Source code & AGPL licence"
      meta="Tahti is fully open source under the GNU Affero General Public Licence v3."
    >
      <LegalDocSection title="Read the source">
        <p className={p}>
          Every line of code that runs this platform is publicly available. The
          repository includes the API, the web application, the streaming
          infrastructure, the worker services, and the governance tooling.
        </p>
        <p className={p}>
          <ExternalLink
            href="https://github.com/tahti-live/tahti-org"
            className={link}
          >
            github.com/tahti-live/tahti-org →
          </ExternalLink>
        </p>
      </LegalDocSection>

      <LegalDocSection title="What AGPL-3.0 means">
        <p className={p}>
          The{' '}
          <ExternalLink
            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
            className={link}
          >
            AGPL-3.0 licence
          </ExternalLink>{' '}
          is a strong copyleft licence. In short:
        </p>
        <ul className={ul}>
          <li>You can use, study, and modify the code freely.</li>
          <li>
            If you distribute the software (as a binary or as a service), you
            must make the complete source available to users of that service.
          </li>
          <li>
            Modifications must be released under the same AGPL-3.0 licence.
          </li>
          <li>
            The &ldquo;network use&rdquo; clause (section 13) means that running
            a Tahti fork as a web service for others constitutes distribution —
            you cannot keep modifications private.
          </li>
        </ul>
        <p className={p}>
          Your content is <strong className="text-foreground">not</strong>{' '}
          affected by this licence. Anything you upload or broadcast belongs to
          you. AGPL governs the software, not your music or recordings.
        </p>
      </LegalDocSection>

      <LegalDocSection title="You can fork this">
        <p className={p}>
          We mean it. The platform was designed to be forkable. If you want to
          run a Tahti instance for your local music community, regional scene,
          or artist collective:
        </p>
        <ol className={ol}>
          <li>
            Clone the repository and follow the setup guide in{' '}
            <code className="font-mono text-xs">README.md</code>.
          </li>
          <li>
            The infrastructure is described in{' '}
            <code className="font-mono text-xs">infra/</code> — Docker Compose
            stack with Postgres, Redis, MinIO, Liquidsoap, and Caddy.
          </li>
          <li>
            The worker services (broadcast orchestrator, Tahti Radio, grant
            engine) are standalone Node.js processes in{' '}
            <code className="font-mono text-xs">services/</code>.
          </li>
          <li>
            Open an issue on GitHub if you are setting up a fork — we will help
            you get unstuck and list your fork in our documentation.
          </li>
        </ol>
      </LegalDocSection>

      <LegalDocSection title="Running a commercial fork?">
        <p className={p}>
          If you are running a for-profit fork as a SaaS product, AGPL still
          requires you to publish your source. We also ask that you reach out:{' '}
          <a href="mailto:tech@tahti.live" className={link}>
            tech@tahti.live
          </a>
          . We are happy to discuss licensing arrangements and may be able to
          offer commercial support.
        </p>
      </LegalDocSection>

      <LegalDocSection title="Licence text">
        <p className={p}>
          The full licence text is in the repository at{' '}
          <ExternalLink
            href="https://github.com/tahti-live/tahti-org/blob/main/LICENCE"
            className={link}
          >
            LICENCE
          </ExternalLink>
          . The short version: GNU AGPL version 3, no additional terms.
        </p>
      </LegalDocSection>
    </LegalDocShell>
  );
}
