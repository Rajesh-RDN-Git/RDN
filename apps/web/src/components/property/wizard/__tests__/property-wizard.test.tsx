import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyWizard } from '../property-wizard';

jest.mock('@/lib/api/societies.api', () => ({
  societiesApi: {
    list: jest.fn(() =>
      Promise.resolve({
        data: [{ id: 'soc-1', name: 'Test Society', city: 'BLR', amenities: { items: ['Pool'] } }],
      }),
    ),
  },
}));

jest.mock('@/lib/api/properties.api', () => ({ propertiesApi: { create: jest.fn() } }));
jest.mock('@/lib/api/media.api', () => ({
  mediaApi: { addMedia: jest.fn(), getPresignedUrl: jest.fn(), upload: jest.fn() },
}));

describe('PropertyWizard', () => {
  it('starts on Basics step with progress indicator', () => {
    render(
      <PropertyWizard
        userRole="OWNER"
        userId="u-1"
        primarySocietyId="soc-1"
        onPublished={jest.fn()}
      />,
    );
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flat number/i)).toBeInTheDocument();
  });

  it('blocks Next when basics step has errors', () => {
    render(
      <PropertyWizard
        userRole="OWNER"
        userId="u-1"
        primarySocietyId="soc-1"
        onPublished={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/flat number required/i)).toBeInTheDocument();
  });
});
