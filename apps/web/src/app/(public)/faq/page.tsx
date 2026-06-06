import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'FAQs — RDN',
  description: 'Answers to common questions about renting, selling, and dealing on RDN.',
};

export default function FaqPage() {
  return (
    <ComingSoon
      title="Frequently Asked Questions"
      description="Answers to common questions about listing, enquiring, dealer verification, and payments on RDN are being compiled."
    />
  );
}
