'use client';

import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { leadsApi } from '../../lib/api/leads.api';
import { useAuthStore } from '../../stores/auth-store';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
}

export function EnquiryModal({ isOpen, onClose, propertyId, propertyName }: EnquiryModalProps) {
  const { isAuthenticated } = useAuthStore();
  const [source, setSource] = useState('APP_SEARCH');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/property/${propertyId}`;
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await leadsApi.create({ propertyId, source });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enquire Now">
      {success ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Enquiry Submitted!</h3>
          <p className="mt-2 text-sm text-gray-500">
            A dealer will contact you shortly about {propertyName}.
          </p>
          <Button onClick={handleClose} className="mt-4">
            Done
          </Button>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            Submit an enquiry for <strong>{propertyName}</strong>. A community dealer will reach out
            to you.
          </p>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              How did you find this?
            </label>
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="APP_SEARCH">App Search</option>
              <option value="REFERRAL">Referral</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WALK_IN">Walk-in</option>
            </Select>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting
                ? 'Submitting...'
                : isAuthenticated
                  ? 'Submit Enquiry'
                  : 'Login to Enquire'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
