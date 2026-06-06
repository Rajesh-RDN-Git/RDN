import { Metadata } from 'next';
import { ComingSoon } from '@/components/marketing/coming-soon';

export const metadata: Metadata = {
  title: 'Contact Us — RDN',
  description: 'Get in touch with the RDN team.',
};

export default function ContactPage() {
  return (
    <ComingSoon
      title="Contact Us"
      description="Need help or want to onboard your society? A contact form and support details will be available here shortly."
    />
  );
}
