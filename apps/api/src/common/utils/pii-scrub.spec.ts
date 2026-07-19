import { scrubPii } from './pii-scrub';

describe('scrubPii', () => {
  it('redacts known PII keys at the top level', () => {
    const out = scrubPii({ phone: '+919812345678', name: 'Asha' });
    expect(out.phone).toBe('[redacted]');
    expect(out.name).toBe('Asha');
  });

  it('is case-insensitive on key names', () => {
    const out = scrubPii({ Phone: '+91...', BankAccountDetails: { a: 1 } });
    expect(out.Phone).toBe('[redacted]');
    expect(out.BankAccountDetails).toBe('[redacted]');
  });

  it('redacts nested and array-embedded PII', () => {
    const out = scrubPii({
      user: { contact: 'x', profile: { email: 'a@b.com' } },
      leads: [{ contactPhone: '999' }],
    });
    expect(out.user.contact).toBe('[redacted]');
    expect(out.user.profile.email).toBe('[redacted]');
    expect(out.leads[0].contactPhone).toBe('[redacted]');
  });

  it('leaves non-PII values untouched', () => {
    const out = scrubPii({ societyId: 'soc-1', count: 3, active: true });
    expect(out).toEqual({ societyId: 'soc-1', count: 3, active: true });
  });

  it('handles null/undefined/primitives safely', () => {
    expect(scrubPii(null)).toBeNull();
    expect(scrubPii(undefined)).toBeUndefined();
    expect(scrubPii('plain')).toBe('plain');
    expect(scrubPii(42)).toBe(42);
  });
});
