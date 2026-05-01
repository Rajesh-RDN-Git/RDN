import { render, screen } from '@testing-library/react';
import { WizardProvider } from '../../wizard-context';
import { BasicsStep } from '../basics-step';

const mockSocieties = [
  { id: 'soc-1', name: 'Green Valley', city: 'Bengaluru' },
  { id: 'soc-2', name: 'Sunrise Heights', city: 'Bengaluru' },
];

// Mock the actual import path used by basics-step.tsx
jest.mock('@/lib/api/societies.api', () => ({
  societiesApi: { list: jest.fn(() => Promise.resolve({ data: mockSocieties })) },
}));

describe('BasicsStep', () => {
  it('renders all required fields', () => {
    render(
      <WizardProvider>
        <BasicsStep userRole="OWNER" primarySocietyId="soc-1" />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/flat number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tower/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/property type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
  });

  it('locks society field for OWNER role', () => {
    render(
      <WizardProvider>
        <BasicsStep userRole="OWNER" primarySocietyId="soc-1" />
      </WizardProvider>,
    );
    const societyInput = screen.getByLabelText(/society/i) as HTMLSelectElement;
    expect(societyInput).toBeDisabled();
  });

  it('allows society selection for SUPER_ADMIN', async () => {
    render(
      <WizardProvider>
        <BasicsStep userRole="SUPER_ADMIN" primarySocietyId={null} />
      </WizardProvider>,
    );
    const societyInput = await screen.findByLabelText(/society/i);
    expect(societyInput).not.toBeDisabled();
  });
});
