import { Metadata } from 'next';
import { HeroSection } from '@/components/home/hero-section';
import { TrustIndicators } from '@/components/home/trust-indicators';
import { FeaturedSocieties } from '@/components/home/featured-societies';
import { RecentListings } from '@/components/home/recent-listings';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContactWidget } from '@/components/layout/contact-widget';

export const metadata: Metadata = {
  title: 'RDN — Community-Driven Real Estate for Residential Societies',
  description:
    'Find verified properties for rent and sale in residential societies. No external brokers — connect directly with community dealers.',
  openGraph: {
    title: 'RDN — Community-Driven Real Estate',
    description:
      "India's first community-driven real estate platform. Browse verified properties from trusted society dealers.",
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RDN - Resident Dealer Network',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rdn.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rdn.in'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <HeroSection />
        <TrustIndicators />
        <FeaturedSocieties />
        <RecentListings />
      </main>
      <Footer />
      <ContactWidget />
    </>
  );
}
