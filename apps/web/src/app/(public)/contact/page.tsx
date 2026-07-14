import { Metadata } from 'next';
import { SUPPORT } from '@/lib/support';
import { PhoneIcon, WhatsAppIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Contact Us — RDN',
  description: 'Talk to the RDN customer care team — call or chat on WhatsApp.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-display-sm text-foreground">Contact Us</h1>
      <p className="mt-2 max-w-xl text-body-md text-muted-foreground">
        Need help buying, renting, listing, or onboarding your society? Our customer care team is
        here to help.
      </p>

      <div className="mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <a
          href={SUPPORT.tel}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-brand"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <PhoneIcon size={22} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Call us</span>
            <span className="block text-body-md text-muted-foreground">{SUPPORT.display}</span>
          </span>
        </a>

        <a
          href={SUPPORT.whatsapp()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-brand"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
            <WhatsAppIcon size={22} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Chat on WhatsApp</span>
            <span className="block text-body-md text-muted-foreground">{SUPPORT.display}</span>
          </span>
        </a>
      </div>

      <p className="mt-6 text-body-sm text-muted-foreground">
        Customer care hours: Mon–Sat, 9 AM – 7 PM IST.
      </p>
    </div>
  );
}
