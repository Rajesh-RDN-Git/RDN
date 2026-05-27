import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — RDN',
  description:
    'How RDN collects, processes, and protects your personal data under the DPDP Act 2023.',
};

const LAST_UPDATED = '2026-05-27';
const POLICY_VERSION = '1.0';

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-500">
        Version {POLICY_VERSION} · Last updated {LAST_UPDATED}
      </p>

      <p>
        RDN (&quot;we&quot;, &quot;us&quot;) is the Data Fiduciary for personal data processed
        through the RDN platform (website, web app, and mobile apps). This notice complies with the
        Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable rules.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> phone number (mandatory), name, email (optional), role, society
          affiliation.
        </li>
        <li>
          <strong>Property listings (owners):</strong> address, photos, amenities, pricing.
        </li>
        <li>
          <strong>Dealer applications:</strong> KYC documents, bank details (encrypted).
        </li>
        <li>
          <strong>Communications:</strong> in-app chat messages, masked call metadata (not call
          recordings).
        </li>
        <li>
          <strong>Device + usage:</strong> device push token, app version, IP, coarse location
          (city), interaction telemetry.
        </li>
        <li>
          <strong>Payments:</strong> transaction status and amount; card / UPI details are handled
          by Razorpay and are not stored by us.
        </li>
      </ul>

      <h2>2. Purposes</h2>
      <ul>
        <li>Provide and operate the RDN platform (account, search, listings, leads, chat).</li>
        <li>Identity verification (OTP via MSG91), dealer KYC.</li>
        <li>Masked communication routing (Exotel).</li>
        <li>Payments and commission settlement (Razorpay).</li>
        <li>Notifications: push (FCM), email (AWS SES), WhatsApp (Interakt).</li>
        <li>Fraud prevention, abuse detection, grievance handling, legal compliance.</li>
        <li>Aggregate analytics. We do not sell personal data.</li>
      </ul>

      <h2>3. Legal basis</h2>
      <p>
        We process your data on the basis of your <strong>consent</strong> obtained at signup and
        when you grant additional permissions, and on legitimate uses recognised under Section 7 of
        the DPDP Act (e.g., performing a service you requested, complying with law).
      </p>

      <h2>4. Where your data is stored</h2>
      <ul>
        <li>AWS Mumbai region (RDS Postgres, S3) — primary storage.</li>
        <li>Cloudflare R2 (UAT period only) — primary storage during pilot.</li>
        <li>Firebase Cloud Messaging (Google, US-hosted) — push notification delivery.</li>
        <li>Sentry (US or EU region) — crash reports (PII scrubbed before send).</li>
        <li>
          MSG91, Razorpay, Exotel, Interakt — Indian vendors for OTP, payments, calls, WhatsApp.
        </li>
      </ul>

      <h2>5. Retention</h2>
      <p>
        We retain data for the periods set out in our <a href="/grievance">Retention Policy</a>.
        Highlights: OTPs ~5 minutes, sessions 30 days, chats 2 years post-listing-close, property
        listings 7 years, financial transactions 7 years (legal requirement), audit logs 1 year.
      </p>

      <h2>6. Your rights (DPDP Sections 11–15)</h2>
      <ul>
        <li>
          <strong>Access &amp; portability:</strong> request a JSON export of your data from Profile
          → Data export.
        </li>
        <li>
          <strong>Correction:</strong> edit your profile in-app.
        </li>
        <li>
          <strong>Erasure:</strong> delete your account from Profile → Delete account. Active leads,
          transactions, and legally required records are retained per Section 8(7) and purged after
          the retention period.
        </li>
        <li>
          <strong>Nominate:</strong> set a nominee for post-mortem account handling in Profile.
        </li>
        <li>
          <strong>Withdraw consent:</strong> Profile → Manage consent.
        </li>
        <li>
          <strong>Grievance redressal:</strong> see Section 9.
        </li>
      </ul>

      <h2>7. Children</h2>
      <p>
        RDN is intended for users aged 18 and above. We do not knowingly process personal data of
        children. If you believe a child has provided us data, contact the Grievance Officer for
        prompt removal.
      </p>

      <h2>8. Security</h2>
      <p>
        Sensitive fields (phone, KYC, bank details) are encrypted at the application layer
        (AES-256-GCM) before storage. TLS in transit. Restricted database IAM. PII scrubbed from
        application logs and crash reports.
      </p>

      <h2>9. Grievance Officer</h2>
      <p>For data protection grievances, contact our designated Grievance Officer:</p>
      <ul>
        <li>
          <strong>Name:</strong> [Grievance Officer Name — to be designated]
        </li>
        <li>
          <strong>Email:</strong> grievance@rdn.example.com
        </li>
        <li>
          <strong>Phone:</strong> +91-XX-XXXX-XXXX
        </li>
      </ul>
      <p>
        We will acknowledge within 7 days and resolve within 30 days. If unsatisfied, you may
        approach the Data Protection Board of India.
      </p>

      <h2>10. Changes</h2>
      <p>We may update this notice. Material changes will prompt a fresh consent in-app.</p>
    </article>
  );
}
