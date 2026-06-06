import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'How It Works — RDN',
  description: 'See how owners, dealers, and buyers transact safely within their society on RDN.',
};

export default function HowItWorksPage() {
  return (
    <ComingSoon
      title="How It Works"
      description="Owners list, society dealers get matched, and buyers enquire — all within a verified, masked, community-controlled flow. A detailed walkthrough is coming soon."
    />
  );
}
