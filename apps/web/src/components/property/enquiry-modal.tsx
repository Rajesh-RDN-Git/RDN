'use client';

import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { CheckIcon, ChatIcon } from '../ui/icons';
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
      window.location.href = `/login?from=/property/${propertyId}`;
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
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
            <CheckIcon size={28} className="text-success-icon" />
          </div>
          <h3 className="text-heading-md text-foreground">Enquiry Submitted!</h3>
          <p className="mx-auto mt-2 max-w-xs text-body-md text-muted-foreground">
            A community dealer will contact you shortly about {propertyName}.
          </p>
          <Button onClick={handleClose} className="mt-6">
            Done
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-start gap-3 rounded-lg bg-brand-subtle p-4">
            <ChatIcon size={20} className="mt-0.5 flex-shrink-0 text-brand" />
            <div>
              <p className="text-label-md text-foreground">{propertyName}</p>
              <p className="mt-0.5 text-body-sm text-muted-foreground">
                A verified community dealer will reach out to you
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-label-sm text-foreground">
              How did you find this property?
            </label>
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="APP_SEARCH">App Search</option>
              <option value="REFERRAL">Referral</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WALK_IN">Walk-in</option>
            </Select>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={submitting} className="flex-1">
              {isAuthenticated ? 'Submit Enquiry' : 'Login to Enquire'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
