// Central customer-care / contact details. Single source of truth so the number
// stays consistent across the floating widget, contact page, and footer.
const RAW = '8878178188'; // 10-digit Indian mobile
const CC = '91';

export const SUPPORT = {
  /** Human-readable, e.g. +91 88781 78188 */
  display: `+${CC} ${RAW.slice(0, 5)} ${RAW.slice(5)}`,
  /** tel: href (E.164) */
  tel: `tel:+${CC}${RAW}`,
  /** WhatsApp deep link; optional prefilled message */
  whatsapp: (text = 'Hi RDN, I need help.') =>
    `https://wa.me/${CC}${RAW}?text=${encodeURIComponent(text)}`,
};
