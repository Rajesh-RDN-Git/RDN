import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Commission Structure — RDN',
  description: 'How dealer commissions work on RDN.',
};

export default function CommissionPage() {
  return (
    <ComingSoon
      title="Commission Structure"
      description="How RDN community dealers earn commission on closed deals — transparent splits and payout timelines coming soon."
    />
  );
}
