import React from 'react';
import { render, screen } from '@testing-library/react';
import { WizardProvider, useWizard } from '../../wizard-context';
import { PricingStep } from '../pricing-step';

const Setup = ({ tx }: { tx: 'RENT' | 'SALE' | 'BOTH' }) => {
  const { dispatch } = useWizard();
  React.useEffect(() => {
    dispatch({ type: 'SET_FIELD', field: 'transactionType', value: tx });
  }, [dispatch, tx]);
  return <PricingStep />;
};

describe('PricingStep', () => {
  it('shows rent + deposit + maintenance for RENT', () => {
    render(
      <WizardProvider>
        <Setup tx="RENT" />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/security deposit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maintenance/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/sale price/i)).not.toBeInTheDocument();
  });

  it('shows sale price for SALE', () => {
    render(
      <WizardProvider>
        <Setup tx="SALE" />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/monthly rent/i)).not.toBeInTheDocument();
  });

  it('shows all fields for BOTH', () => {
    render(
      <WizardProvider>
        <Setup tx="BOTH" />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
  });
});
