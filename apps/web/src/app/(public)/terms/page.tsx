import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — RDN',
  description: 'Terms governing your use of the RDN platform.',
};

const LAST_UPDATED = '2026-05-27';
const TERMS_VERSION = '1.0';

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      <h1>Terms of Service</h1>
      <p className="text-sm text-slate-500">
        Version {TERMS_VERSION} · Last updated {LAST_UPDATED}
      </p>

      <p>
        By using RDN you agree to these terms. RDN is a residential dealer network platform for
        Indian housing societies connecting RWAs, resident dealers, property owners, and prospective
        buyers/tenants.
      </p>

      <h2>1. Eligibility</h2>
      <p>You must be 18 or older and resident in India.</p>

      <h2>2. Account</h2>
      <p>
        You are responsible for activity on your account. Keep your phone number current; you log in
        via OTP. One account per phone number.
      </p>

      <h2>3. Listings</h2>
      <p>
        Owners warrant they have the right to list the property. Misrepresentation may result in
        listing removal and account suspension. RWA admins verify listings within their society.
      </p>

      <h2>4. Dealers</h2>
      <p>
        Dealers must be residents of the society they operate in, complete KYC, and be approved by
        their RWA admin. Dealers earn commission on closed transactions per the published rate card.
      </p>

      <h2>5. Communication</h2>
      <p>
        Phone numbers are masked. We do not record voice calls. Chat messages are retained per our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>6. Payments</h2>
      <p>
        Commission and platform fees are processed via Razorpay. RDN does not store card or UPI
        details.
      </p>

      <h2>7. Prohibited conduct</h2>
      <ul>
        <li>Discrimination based on religion, caste, or gender.</li>
        <li>Fake listings or fabricated reviews.</li>
        <li>Harassment or unlawful contact of other users.</li>
        <li>Circumventing the dealer/commission flow.</li>
      </ul>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate accounts that breach these terms. You may delete your account at
        any time via Profile → Delete account.
      </p>

      <h2>9. Disclaimer</h2>
      <p>
        RDN is a facilitator and does not own, lease, or sell the listed properties. RDN is not a
        party to any rental or sale agreement between users.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, RDN&apos;s aggregate liability is limited to the
        platform fees paid by you in the 12 months preceding the claim.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts at [City] have exclusive jurisdiction.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions: support@rdn.example.com · Data grievances: see{' '}
        <a href="/privacy">Privacy Policy</a> Section 9.
      </p>
    </article>
  );
}
