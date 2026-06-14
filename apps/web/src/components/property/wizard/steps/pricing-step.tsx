'use client';

import { Input } from '@/components/ui/input';
import { useWizard } from '../wizard-context';
import { RequiredMark, OptionalTag } from '../field-label';

export function PricingStep() {
  const { state, dispatch } = useWizard();
  const { data, errors } = state;
  const showRent = data.transactionType === 'RENT' || data.transactionType === 'BOTH';
  const showSale = data.transactionType === 'SALE' || data.transactionType === 'BOTH';

  const setNum =
    (field: 'priceRent' | 'priceSale' | 'securityDeposit') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({
        type: 'SET_FIELD',
        field,
        value: e.target.value ? Number(e.target.value) : undefined,
      });

  return (
    <div className="space-y-4">
      {showRent && (
        <>
          <div>
            <label htmlFor="priceRent" className="mb-1.5 block text-sm font-medium text-foreground">
              Monthly rent (₹)
              <RequiredMark />
            </label>
            <Input
              id="priceRent"
              type="number"
              value={data.priceRent ?? ''}
              error={errors.priceRent}
              onChange={setNum('priceRent')}
            />
          </div>
          <div>
            <label
              htmlFor="securityDeposit"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Security deposit (₹)
              <OptionalTag />
            </label>
            <Input
              id="securityDeposit"
              type="number"
              value={data.securityDeposit ?? ''}
              onChange={setNum('securityDeposit')}
            />
          </div>
        </>
      )}
      {showSale && (
        <div>
          <label htmlFor="priceSale" className="mb-1.5 block text-sm font-medium text-foreground">
            Sale price (₹)
            <RequiredMark />
          </label>
          <Input
            id="priceSale"
            type="number"
            value={data.priceSale ?? ''}
            error={errors.priceSale}
            onChange={setNum('priceSale')}
          />
        </div>
      )}
    </div>
  );
}
