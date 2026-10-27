import { LegalDocSection, LegalDocShell } from '../components/LegalDocShell';

const p = 'text-foreground-secondary text-sm leading-relaxed';
const ul = 'text-foreground-secondary list-disc space-y-1 pl-5 text-sm';
const mail = 'underline-offset-2 hover:underline';

export function PrivacyView() {
  return (
    <LegalDocShell
      title="Privacy policy"
      meta="Effective date: 1 August 2026. Data controller: Tahti ry, Finland."
    >
      <LegalDocSection title="Who we are">
        <p className={p}>
          Tahti ry (business ID to be registered) is a Finnish nonprofit
          association (yhdistys) and the data controller for personal data
          processed through the tahti.live platform. Contact:{' '}
          <a href="mailto:tietosuoja@tahti.live" className={mail}>
            tietosuoja@tahti.live
          </a>
          .
        </p>
      </LegalDocSection>

      <LegalDocSection title="What we collect and why">
        <dl className="flex flex-col gap-2 text-sm">
          {[
            {
              term: 'Account data',
              body: 'Email address, username, display name, optional avatar and bio. Collected when you register. Used to operate your account, authenticate you, and let listeners find you.',
            },
            {
              term: 'Payment data',
              body: 'Stripe processes all card payments. We receive a Stripe customer ID and subscription status. We do not store card numbers or bank details.',
            },
            {
              term: 'Content you upload',
              body: 'Audio files, release metadata, tracklists, images, and newsletter text. Stored to provide the platform service. You retain full copyright.',
            },
            {
              term: 'Usage data',
              body: 'Play counts, download counts, and fan subscription activity. Used to calculate your engagement units for the annual grant distribution. Aggregated totals are published on the transparency page (with your consent for attribution).',
            },
            {
              term: 'Listening statistics',
              body: 'While a track or channel plays, the player tells us every few minutes that you are still listening. For each listening session we store the track or channel, the time, a hash of your IP address that changes daily, your country and city looked up from the IP, your browser, operating system and device type and maker read from the user agent, the host of the site that linked you here, and how far into a track you got. The IP address and the full user agent are not stored. Artists see only shares across all their listeners, and a browser, device, site or city is only named once at least five listens share it.',
            },
            {
              term: 'Newsletter data',
              body: 'If listeners subscribe to your newsletter, their email addresses are stored on your behalf. You are the data controller for your subscriber list; we are the processor.',
            },
            {
              term: 'Technical logs',
              body: 'Server access logs (IP address, user agent, timestamp) retained for 30 days for security and debugging. Not used for profiling or advertising.',
            },
          ].map((entry) => (
            <div key={entry.term} className="flex flex-col gap-0.5">
              <dt className="text-foreground text-xs font-semibold">
                {entry.term}
              </dt>
              <dd className="text-foreground-secondary">{entry.body}</dd>
            </div>
          ))}
        </dl>
      </LegalDocSection>

      <LegalDocSection title="Cookies">
        <p className={p}>
          We use one session cookie (
          <code className="font-mono text-xs">tahti_session</code>) to keep you
          logged in. It is strictly necessary for authentication and cannot be
          opted out while using the platform. We do not use advertising cookies,
          tracking pixels, or third-party analytics scripts.
        </p>
      </LegalDocSection>

      <LegalDocSection title="Who we share data with">
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Stripe</strong> — payment
            processing. Their privacy policy applies to payment data.
          </li>
          <li>
            <strong className="text-foreground">Hetzner / UpCloud</strong> —
            infrastructure hosting within the EU/EEA.
          </li>
          <li>
            <strong className="text-foreground">Revelator</strong> — music
            distribution to DSPs, if you opt in to distribution. Only release
            metadata (title, ISRC, credits) is shared, not personal account
            data.
          </li>
        </ul>
        <p className={p}>
          We do not sell data, share data with advertisers, or transfer data
          outside the EU/EEA without Standard Contractual Clauses.
        </p>
      </LegalDocSection>

      <LegalDocSection title="How long we keep data">
        <ul className={ul}>
          <li>
            Account data: kept while your account is active, plus 1 year after
            deletion.
          </li>
          <li>
            Upload content: deleted within 30 days of account deletion (or
            immediately on request).
          </li>
          <li>Payment records: 7 years (Finnish accounting law).</li>
          <li>
            Engagement unit data: 7 years (required for grant audit trail).
          </li>
          <li>Server logs: 30 days.</li>
        </ul>
      </LegalDocSection>

      <LegalDocSection title="Your rights under GDPR">
        <p className={p}>You have the right to:</p>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Access</strong> — request a copy
            of all personal data we hold about you.
          </li>
          <li>
            <strong className="text-foreground">Rectification</strong> — correct
            inaccurate data.
          </li>
          <li>
            <strong className="text-foreground">Erasure</strong> — delete your
            account and personal data.
          </li>
          <li>
            <strong className="text-foreground">Portability</strong> — download
            your data as JSON from Settings → Account → Data export: your
            profile, uploads, releases with their tracks, collections, posts,
            events, comments, chat messages and track reactions, likes, reposts,
            follows, messages you sent, purchases and subscriptions, support
            requests and your replies, feature requests and governance activity
            (comments, seconds, your votes, correction requests, your discussion
            replies and the discussions you follow), the radio stations, themes
            and embeds you added, downloads, Tahti Jams, listening sessions, the
            venues you run and venue shows you booked, tracks you sent to Tahti
            Radio and stations you suggested, your fan subscription tiers and
            store items, any restrictions the board placed on your account, your
            notifications, grants and fan-subscription payouts, the add-ons you
            published or installed, your signed-in devices and API tokens (names
            only, never the secrets), the private-track shares and green-room
            invites you made or received, your email address change requests,
            and your notification and visibility settings. Other people appear
            by username only.
          </li>
          <li>
            <strong className="text-foreground">Objection</strong> — object to
            processing for legitimate interests.
          </li>
          <li>
            <strong className="text-foreground">Restriction</strong> — restrict
            processing while a dispute is resolved.
          </li>
        </ul>
        <p className={p}>
          To exercise any right, email{' '}
          <a href="mailto:tietosuoja@tahti.live" className={mail}>
            tietosuoja@tahti.live
          </a>
          . We respond within 30 days. If you are not satisfied, you may lodge a
          complaint with the Finnish Data Protection Ombudsman (tietosuoja.fi).
        </p>
      </LegalDocSection>

      <LegalDocSection title="Changes to this policy">
        <p className={p}>
          We will notify registered artists by email of any material changes at
          least 30 days before they take effect. The current version is always
          at this URL.
        </p>
      </LegalDocSection>
    </LegalDocShell>
  );
}
