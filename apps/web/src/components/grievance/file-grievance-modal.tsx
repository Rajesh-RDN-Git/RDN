'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckIcon, ShieldIcon } from '@/components/ui/icons';
import { showToast } from '@/stores/toast-store';
import {
  grievancesApi,
  type CreateGrievancePayload,
  type GrievanceCategory,
  type GrievanceSeverity,
} from '@/lib/api/grievances.api';

interface FileGrievanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const CATEGORY_OPTIONS: { value: GrievanceCategory; label: string }[] = [
  { value: 'DEALER_CONDUCT', label: 'Dealer Conduct' },
  { value: 'PROPERTY_MISMATCH', label: 'Property Mismatch' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const SEVERITY_OPTIONS: { value: GrievanceSeverity; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export function FileGrievanceModal({ open, onClose, onSubmitted }: FileGrievanceModalProps) {
  const [category, setCategory] = useState<GrievanceCategory>('SERVICE');
  const [severity, setSeverity] = useState<GrievanceSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const reset = () => {
    setCategory('SERVICE');
    setSeverity('MEDIUM');
    setDescription('');
    setSuccess(false);
    setError(null);
    setDescriptionError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    setDescriptionError(null);
    if (description.trim().length < 10) {
      setDescriptionError('Please describe the issue in at least 10 characters.');
      return;
    }
    if (description.trim().length > 5000) {
      setDescriptionError('Description must be under 5000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateGrievancePayload = {
        category,
        severity,
        description: description.trim(),
      };
      await grievancesApi.create(payload);
      showToast.success('Grievance filed successfully');
      setSuccess(true);
      onSubmitted?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to file grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="File a Grievance">
      {success ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
            <CheckIcon size={28} className="text-success-icon" />
          </div>
          <h3 className="text-heading-md text-foreground">Grievance Submitted</h3>
          <p className="mx-auto mt-2 max-w-xs text-body-md text-muted-foreground">
            Our team will review your grievance and follow up shortly.
          </p>
          <Button onClick={handleClose} className="mt-6">
            Done
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-start gap-3 rounded-lg bg-brand-subtle p-4">
            <ShieldIcon size={20} className="mt-0.5 flex-shrink-0 text-brand" />
            <div>
              <p className="text-label-md text-foreground">We&apos;re here to help</p>
              <p className="mt-0.5 text-body-sm text-muted-foreground">
                Provide as much detail as possible so we can act quickly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-label-sm text-foreground">Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-label-sm text-foreground">Severity</label>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as GrievanceSeverity)}
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-label-sm text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, when, and any context that helps us investigate."
              rows={6}
              error={descriptionError || undefined}
            />
            {descriptionError && (
              <p className="mt-1 text-caption-md text-error-text">{descriptionError}</p>
            )}
            <p className="mt-1 text-caption-md text-muted-foreground">
              {description.length} / 5000 characters
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={submitting} className="flex-1">
              Submit Grievance
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
