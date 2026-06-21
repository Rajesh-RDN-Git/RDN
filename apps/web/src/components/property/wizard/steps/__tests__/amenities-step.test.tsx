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

  it('renders furnishing detail steppers from the fixed catalog', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    expect(screen.getByText(/furnishing details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/increase ac/i)).toBeInTheDocument();
  });

  it('renders categorized amenities from the fixed catalog', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    expect(screen.getByText('Gymnasium')).toBeInTheDocument();
    expect(screen.getByText('24 x 7 Security')).toBeInTheDocument();
  });
});
