import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Careers — RDN',
  description: 'Help us build community-driven real estate for residential societies.',
};

export default function CareersPage() {
  return (
    <ComingSoon
      title="Careers at RDN"
      description="We're a small team building community-driven real estate across India. Open roles will be posted here soon."
    />
  );
}
