import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Trust & Safety — RDN',
  description: 'How RDN verifies dealers, masks communication, and protects your data.',
};

export default function TrustPage() {
  return (
    <ComingSoon
      title="Trust & Safety"
      description="Verified dealers, masked calling and chat, and application-level encryption of sensitive data keep every RDN transaction safe. Full details are on the way."
    />
  );
}
