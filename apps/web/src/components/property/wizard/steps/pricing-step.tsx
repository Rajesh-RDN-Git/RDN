'use client';

import { Input } from '@/components/ui/input';
import { useWizard } from '../wizard-context';

export function PricingStep() {
  const { state, dispatch } = useWizard();
  const { data } = state;
  const showRent = data.transactionType === 'RENT' || data.transactionType === 'BOTH';
  const showSale = data.transactionType === 'SALE' || data.transactionType === 'BOTH';

  const setNum =
    (field: 'priceRent' | 'priceSale' | 'securityDeposit' | 'maintenance') =>
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
            </label>
            <Input
              id="priceRent"
              type="number"
              value={data.priceRent ?? ''}
              onChange={setNum('priceRent')}
            />
          </div>
          <div>
            <label
              htmlFor="securityDeposit"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Security deposit (₹)
            </label>
            <Input
              id="securityDeposit"
              type="number"
              value={data.securityDeposit ?? ''}
              onChange={setNum('securityDeposit')}
            />
          </div>
          <div>
            <label
              htmlFor="maintenance"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Maintenance (₹/month)
            </label>
            <Input
              id="maintenance"
              type="number"
              value={data.maintenance ?? ''}
              onChange={setNum('maintenance')}
            />
          </div>
        </>
      )}
      {showSale && (
        <div>
          <label htmlFor="priceSale" className="mb-1.5 block text-sm font-medium text-foreground">
            Sale price (₹)
          </label>
          <Input
            id="priceSale"
            type="number"
            value={data.priceSale ?? ''}
            onChange={setNum('priceSale')}
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          id="negotiable"
          type="checkbox"
          checked={!!data.negotiable}
          onChange={(e) =>
            dispatch({ type: 'SET_FIELD', field: 'negotiable', value: e.target.checked })
          }
        />
        <label htmlFor="negotiable" className="text-sm">
          Price is negotiable
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          id="brokerageDisclosed"
          type="checkbox"
          checked={!!data.brokerageDisclosed}
          onChange={(e) =>
            dispatch({ type: 'SET_FIELD', field: 'brokerageDisclosed', value: e.target.checked })
          }
        />
        <label htmlFor="brokerageDisclosed" className="text-sm">
          Brokerage applies (disclose now)
        </label>
      </div>
    </div>
  );
}
