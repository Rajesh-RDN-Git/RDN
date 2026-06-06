import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Dealer Resources — RDN',
  description: 'Tools and guides for RDN community dealers.',
};

export default function ResourcesPage() {
  return (
    <ComingSoon
      title="Dealer Resources"
      description="Playbooks, templates, and tools to help RDN community dealers serve their society. Resources are being prepared."
    />
  );
}
