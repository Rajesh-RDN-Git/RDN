import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Dealer Training — RDN',
  description: 'Get certified as an RDN community dealer.',
};

export default function TrainingPage() {
  return (
    <ComingSoon
      title="Dealer Training"
      description="Our certification program for RDN community dealers — covering listings, masked communication, and closing deals — launches soon."
    />
  );
}
