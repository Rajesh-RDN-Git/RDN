import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardProvider, useWizard } from '../../wizard-context';
import { ReviewStep } from '../review-step';

jest.mock('@/lib/api/properties.api', () => ({
  propertiesApi: { create: jest.fn(() => Promise.resolve({ data: { id: 'prop-new' } })) },
}));

jest.mock('@/lib/api/media.api', () => ({
  mediaApi: { addMedia: jest.fn(() => Promise.resolve({ data: {} })) },
}));

const Setup = () => {
  const { dispatch } = useWizard();
  React.useEffect(() => {
    dispatch({
      type: 'LOAD_DRAFT',
      data: {
        societyId: 'soc-1',
        flatNumber: 'A-101',
        towerBlock: 'Tower A',
        type: 'APARTMENT',
        transactionType: 'RENT',
        bhk: 2,
        priceRent: 25000,
        photos: [
          { id: 'p1', key: 'p1', url: 'https://cdn/1.jpg', isCover: true, order: 0 },
          { id: 'p2', key: 'p2', url: 'https://cdn/2.jpg', isCover: false, order: 1 },
          { id: 'p3', key: 'p3', url: 'https://cdn/3.jpg', isCover: false, order: 2 },
        ],
        amenities: ['Pool', 'Gym'],
        restrictions: {},
      },
    });
  }, [dispatch]);
  return <ReviewStep onPublished={jest.fn()} userId="u-1" />;
};

describe('ReviewStep', () => {
  it('renders summary fields from wizard state', () => {
    render(
      <WizardProvider>
        <Setup />
      </WizardProvider>,
    );
    expect(screen.getByText(/A-101/)).toBeInTheDocument();
    expect(screen.getByText(/Tower A/)).toBeInTheDocument();
    expect(screen.getByText(/2 BHK/)).toBeInTheDocument();
    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  it('shows Save Draft and Submit for Verification CTAs', () => {
    render(
      <WizardProvider>
        <Setup />
      </WizardProvider>,
    );
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit for verification/i })).toBeInTheDocument();
  });

  it('calls propertiesApi.create on submit', async () => {
    const { propertiesApi } = jest.requireMock('@/lib/api/properties.api');
    render(
      <WizardProvider>
        <Setup />
      </WizardProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));
    await waitFor(() => expect(propertiesApi.create).toHaveBeenCalled());
  });
});
