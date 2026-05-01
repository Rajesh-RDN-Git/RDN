import { validateStep } from '../step-validation';
import { INITIAL_DATA } from '../wizard-types';

describe('validateStep', () => {
  it('basics: requires society, flat, tower, type, transactionType', () => {
    const r = validateStep('basics', INITIAL_DATA);
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors)).toEqual(
      expect.arrayContaining(['societyId', 'flatNumber', 'towerBlock', 'type', 'transactionType']),
    );
  });

  it('basics: passes when all required fields present', () => {
    const r = validateStep('basics', {
      ...INITIAL_DATA,
      societyId: 'soc-1',
      flatNumber: 'A-101',
      towerBlock: 'A',
      type: 'APARTMENT',
      transactionType: 'RENT',
    });
    expect(r.ok).toBe(true);
  });

  it('pricing: RENT requires priceRent', () => {
    const r = validateStep('pricing', { ...INITIAL_DATA, transactionType: 'RENT' });
    expect(r.ok).toBe(false);
    expect(r.errors.priceRent).toBeDefined();
  });

  it('pricing: SALE requires priceSale', () => {
    const r = validateStep('pricing', { ...INITIAL_DATA, transactionType: 'SALE' });
    expect(r.ok).toBe(false);
    expect(r.errors.priceSale).toBeDefined();
  });

  it('photos: requires at least 3 photos', () => {
    const r = validateStep('photos', INITIAL_DATA);
    expect(r.ok).toBe(false);
    expect(r.errors.photos).toBeDefined();
  });
});
