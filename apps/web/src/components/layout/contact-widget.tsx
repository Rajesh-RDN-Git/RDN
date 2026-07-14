'use client';

import { useState } from 'react';
import { SUPPORT } from '@/lib/support';
import { PhoneIcon, WhatsAppIcon, ChatIcon, CloseIcon } from '@/components/ui/icons';

/**
 * Floating "Talk to expert" customer-care widget. Expands to a Call and a
 * WhatsApp action, both pointing at the central SUPPORT number.
 */
export function ContactWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-overlay flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 overflow-hidden rounded-xl border border-border bg-card shadow-elevation-3">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Talk to an expert</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Mon–Sat, 9 AM – 7 PM</p>
          </div>
          <a
            href={SUPPORT.tel}
            className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-subtle"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-subtle text-brand">
              <PhoneIcon size={18} />
            </span>
            <span>
              <span className="block font-medium">Call us</span>
              <span className="block text-xs text-muted-foreground">{SUPPORT.display}</span>
            </span>
          </a>
          <a
            href={SUPPORT.whatsapp()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border-t border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-subtle"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
              <WhatsAppIcon size={18} />
            </span>
            <span>
              <span className="block font-medium">Chat on WhatsApp</span>
              <span className="block text-xs text-muted-foreground">{SUPPORT.display}</span>
            </span>
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close contact options' : 'Talk to an expert'}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-elevation-3 transition-transform duration-fast hover:scale-105"
      >
        {open ? <CloseIcon size={24} /> : <ChatIcon size={24} />}
      </button>
    </div>
  );
}
