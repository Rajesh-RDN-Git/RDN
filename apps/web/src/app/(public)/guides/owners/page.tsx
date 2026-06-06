import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Owner Guide — RDN',
  description: 'Everything you need to list and rent or sell your property on RDN.',
};

export default function OwnerGuidePage() {
  return (
    <ComingSoon
      title="Owner Guide"
      description="A step-by-step guide to listing your property, approving visits, and tracking inquiries on RDN is on the way."
    />
  );
}
