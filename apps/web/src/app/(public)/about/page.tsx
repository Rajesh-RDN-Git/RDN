import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'About RDN — Residential Dealer Network',
  description:
    'RDN is replacing external brokers with a community-driven, society-controlled real estate ecosystem.',
};

export default function AboutPage() {
  return (
    <ComingSoon
      title="About RDN"
      description="We're building community-driven real estate for residential societies — connecting RWAs, resident dealers, owners, and buyers without external brokers. Our full story is on the way."
    />
  );
}
