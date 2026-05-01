import { render, screen, fireEvent } from '@testing-library/react';
import { WizardProvider } from '../../wizard-context';
import { AmenitiesStep } from '../amenities-step';

const societyAmenities = ['Pool', 'Gym', 'Park', 'Clubhouse'];

describe('AmenitiesStep', () => {
  it('renders chips for each society amenity', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    societyAmenities.forEach((a) => expect(screen.getByText(a)).toBeInTheDocument());
  });

  it('toggles amenity selection on click', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    const poolChip = screen.getByText('Pool');
    fireEvent.click(poolChip);
    expect(poolChip.closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders restriction toggles', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/vegetarian only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/family only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/no pets/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bachelors allowed/i)).toBeInTheDocument();
  });
});
