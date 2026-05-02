'use client';

import { useEffect, useState } from 'react';
import { WizardProvider, useWizard } from './wizard-context';
import { STEP_ORDER, WizardStep } from './wizard-types';
import { useDraftAutosave, loadDraft } from './use-draft-autosave';
import { validateStep } from './step-validation';
import { BasicsStep } from './steps/basics-step';
import { SpecsStep } from './steps/specs-step';
import { PricingStep } from './steps/pricing-step';
import { PhotosStep } from './steps/photos-step';
import { AmenitiesStep } from './steps/amenities-step';
import { ReviewStep } from './steps/review-step';
import { societiesApi } from '@/lib/api/societies.api';

type Props = {
  userRole: 'OWNER' | 'SUPER_ADMIN';
  userId: string;
  primarySocietyId: string | null;
  onPublished: (propertyId: string) => void;
};

const STEP_LABELS: Record<WizardStep, string> = {
  basics: 'Basics',
  specs: 'Specs',
  pricing: 'Pricing',
  photos: 'Photos',
  amenities: 'Amenities',
  review: 'Review',
};

type SocietyResponse = { id: string; amenities?: { items?: string[] } | string[] };

function extractAmenities(society: SocietyResponse | undefined): string[] {
  if (!society?.amenities) return [];
  if (Array.isArray(society.amenities)) return society.amenities;
  return society.amenities.items ?? [];
}

function WizardInner({ userRole, userId, primarySocietyId, onPublished }: Props) {
  const { state, dispatch } = useWizard();
  const [societyAmenities, setSocietyAmenities] = useState<string[]>([]);
  useDraftAutosave({ userId, data: state.data, isDirty: state.isDirty });

  useEffect(() => {
    if (state.data.societyId) {
      societiesApi
        .list()
        .then((r) => {
          const raw = r.data as SocietyResponse[] | { data: SocietyResponse[] };
          const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
          setSocietyAmenities(extractAmenities(list.find((x) => x.id === state.data.societyId)));
        })
        .catch(() => {
          /* swallow — amenities are optional, wizard still works */
        });
    }
  }, [state.data.societyId]);

  useEffect(() => {
    if (primarySocietyId && !state.data.societyId) {
      const draft = loadDraft({ userId, societyId: primarySocietyId, flatNumber: '' });
      if (draft) dispatch({ type: 'LOAD_DRAFT', data: draft });
    }
  }, [primarySocietyId, userId, state.data.societyId, dispatch]);

  const currentIndex = STEP_ORDER.indexOf(state.currentStep);

  const goNext = () => {
    const result = validateStep(state.currentStep, state.data);
    if (!result.ok) {
      dispatch({ type: 'SET_ERRORS', errors: result.errors });
      return;
    }
    dispatch({ type: 'SET_ERRORS', errors: {} });
    if (currentIndex < STEP_ORDER.length - 1) {
      dispatch({ type: 'GOTO_STEP', step: STEP_ORDER[currentIndex + 1] });
    }
  };

  const goBack = () => {
    if (currentIndex > 0) dispatch({ type: 'GOTO_STEP', step: STEP_ORDER[currentIndex - 1] });
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 'basics':
        return <BasicsStep userRole={userRole} primarySocietyId={primarySocietyId} />;
      case 'specs':
        return <SpecsStep />;
      case 'pricing':
        return <PricingStep />;
      case 'photos':
        return <PhotosStep />;
      case 'amenities':
        return <AmenitiesStep societyAmenities={societyAmenities} />;
      case 'review':
        return <ReviewStep onPublished={onPublished} userId={userId} />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Step {currentIndex + 1} of {STEP_ORDER.length}: {STEP_LABELS[state.currentStep]}
        </p>
        <div className="h-2 bg-muted rounded mt-2">
          <div
            className="h-2 bg-brand rounded transition-all"
            style={{ width: `${((currentIndex + 1) / STEP_ORDER.length) * 100}%` }}
          />
        </div>
      </div>
      {renderStep()}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex justify-between max-w-3xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIndex === 0}
          className="px-4 py-2 border border-border rounded disabled:opacity-50"
        >
          Back
        </button>
        {state.currentStep !== 'review' && (
          <button type="button" onClick={goNext} className="px-4 py-2 bg-brand text-white rounded">
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export function PropertyWizard(props: Props) {
  return (
    <WizardProvider>
      <WizardInner {...props} />
    </WizardProvider>
  );
}
