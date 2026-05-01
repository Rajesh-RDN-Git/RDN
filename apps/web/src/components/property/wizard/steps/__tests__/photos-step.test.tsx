import { render, screen } from '@testing-library/react';
import { WizardProvider } from '../../wizard-context';
import { PhotosStep } from '../photos-step';

jest.mock('@/lib/api/media.api', () => ({
  mediaApi: {
    getPresignedUrl: jest.fn(() =>
      Promise.resolve({
        data: { url: 'https://s3.example/upload', key: 'properties/123.jpg' },
      }),
    ),
    upload: jest.fn(() => Promise.resolve()),
  },
}));

describe('PhotosStep', () => {
  it('renders the upload dropzone', () => {
    render(
      <WizardProvider>
        <PhotosStep />
      </WizardProvider>,
    );
    expect(screen.getByText(/drag photos here|tap to add photos/i)).toBeInTheDocument();
  });

  it('shows minimum-photo warning when fewer than 3 uploaded', () => {
    render(
      <WizardProvider>
        <PhotosStep />
      </WizardProvider>,
    );
    expect(screen.getByText(/at least 3 photos required/i)).toBeInTheDocument();
  });
});
