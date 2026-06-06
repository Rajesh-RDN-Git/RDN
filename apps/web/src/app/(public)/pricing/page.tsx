import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Pricing — RDN',
  description: 'Transparent, society-first pricing for owners and dealers on RDN.',
};

export default function PricingPage() {
  return (
    <ComingSoon
      title="Pricing"
      description="Transparent, society-first pricing with no hidden broker fees. Detailed plans are coming soon."
    />
  );
}
