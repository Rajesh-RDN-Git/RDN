import { render, screen } from '@testing-library/react';
import React from 'react';
import { WizardProvider, useWizard } from '../../wizard-context';
import { SpecsStep } from '../specs-step';

const Setup = ({ propertyType }: { propertyType: 'APARTMENT' | 'COMMERCIAL' | 'VILLA' }) => {
  const { dispatch } = useWizard();
  React.useEffect(() => {
    dispatch({ type: 'SET_FIELD', field: 'type', value: propertyType });
  }, [dispatch, propertyType]);
  return <SpecsStep />;
};

describe('SpecsStep', () => {
  it('shows BHK field for APARTMENT', () => {
    render(
      <WizardProvider>
        <Setup propertyType="APARTMENT" />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/bhk/i)).toBeInTheDocument();
  });

  it('hides BHK field for COMMERCIAL', () => {
    render(
      <WizardProvider>
        <Setup propertyType="COMMERCIAL" />
      </WizardProvider>,
    );
    expect(screen.queryByLabelText(/bhk/i)).not.toBeInTheDocument();
  });

  it('shows carpet area, super area, floor, facing, furnishing', () => {
    render(
      <WizardProvider>
        <Setup propertyType="APARTMENT" />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/carpet area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/super area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^floor$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^facing$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/furnishing/i)).toBeInTheDocument();
  });
});
