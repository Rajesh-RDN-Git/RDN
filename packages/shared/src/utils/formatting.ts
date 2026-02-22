const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return INR_FORMATTER.format(amount);
}

export function formatPhone(phone: string): string {
  if (phone.length < 4) return '****';
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
}
