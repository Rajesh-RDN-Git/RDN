import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useWizard, WizardProvider } from './wizard-context';
import {
  STEP_LABELS,
  STEP_ORDER,
  validateStep,
  type WizardData,
  type WizardStep,
} from './wizard-types';
import { AmenitiesStep, BasicsStep, PhotosStep, PricingStep, ReviewStep, SpecsStep } from './steps';
import { useDraftAutosave, loadDraft, clearDraft } from './use-draft-autosave';
import { propertiesApi } from '@/lib/api/properties';

function StepRenderer({ step }: { step: WizardStep }) {
  switch (step) {
    case 'basics':
      return <BasicsStep />;
    case 'specs':
      return <SpecsStep />;
    case 'pricing':
      return <PricingStep />;
    case 'photos':
      return <PhotosStep />;
    case 'amenities':
      return <AmenitiesStep />;
    case 'review':
      return <ReviewStep />;
  }
}

function ProgressBar({ current }: { current: WizardStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <View style={styles.progressRow}>
      {STEP_ORDER.map((s, i) => (
        <View
          key={s}
          style={[
            styles.progressSeg,
            i <= idx && styles.progressSegActive,
            i === STEP_ORDER.length - 1 && { marginRight: 0 },
          ]}
        />
      ))}
    </View>
  );
}

type WizardInnerProps = {
  /** When provided the wizard runs in edit mode: draft restore is skipped, and
   *  submit delegates to this callback instead of calling propertiesApi.create. */
  onSubmit?: (data: WizardData) => Promise<void>;
};

function WizardInner({ onSubmit: onSubmitProp }: WizardInnerProps) {
  const router = useRouter();
  const { state, dispatch } = useWizard();
  const [submitting, setSubmitting] = useState(false);

  // In edit mode (onSubmitProp provided) autosave is disabled — we don't want
  // to clobber a create-mode draft with edit data.
  useDraftAutosave(state.data, onSubmitProp ? false : state.isDirty);

  useEffect(() => {
    // Skip draft restore when editing an existing listing.
    if (onSubmitProp) return;
    (async () => {
      const draft = await loadDraft();
      if (draft) {
        Alert.alert('Resume draft?', 'You have an unsaved listing draft. Continue editing it?', [
          { text: 'Discard', style: 'destructive', onPress: () => void clearDraft() },
          { text: 'Resume', onPress: () => dispatch({ type: 'LOAD_DRAFT', data: draft }) },
        ]);
      }
    })();
  }, [dispatch, onSubmitProp]);

  const goNext = useCallback(() => {
    const { ok, errors } = validateStep(state.currentStep, state.data);
    dispatch({ type: 'SET_ERRORS', errors });
    if (!ok) return;
    const idx = STEP_ORDER.indexOf(state.currentStep);
    if (idx < STEP_ORDER.length - 1) {
      dispatch({ type: 'GOTO_STEP', step: STEP_ORDER[idx + 1] });
    }
  }, [state.currentStep, state.data, dispatch]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(state.currentStep);
    if (idx > 0) dispatch({ type: 'GOTO_STEP', step: STEP_ORDER[idx - 1] });
  }, [state.currentStep, dispatch]);

  const submit = useCallback(async () => {
    // Re-validate every step before submission
    for (const step of STEP_ORDER) {
      const { ok, errors } = validateStep(step, state.data);
      if (!ok) {
        dispatch({ type: 'SET_ERRORS', errors });
        dispatch({ type: 'GOTO_STEP', step });
        Alert.alert('Incomplete', `Fix errors on the ${STEP_LABELS[step]} step.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      if (onSubmitProp) {
        // Edit mode — delegate entirely to the caller.
        await onSubmitProp(state.data);
      } else {
        // Create mode — original behaviour.
        const payload: Record<string, unknown> = {
          societyId: state.data.societyId,
          flatNumber: state.data.flatNumber,
          towerBlock: state.data.towerBlock,
          type: state.data.type,
          transactionType: state.data.transactionType,
          bhk: state.data.bhk,
          carpetArea: state.data.carpetArea,
          superArea: state.data.superArea,
          floor: state.data.floorLabel ? undefined : state.data.floor,
          floorLabel: state.data.floorLabel,
          totalFloors: state.data.totalFloors,
          facing: state.data.facing,
          furnishing: state.data.furnishing,
          furnishingDetails: state.data.furnishingDetails,
          additionalRooms: state.data.additionalRooms,
          propertyView: state.data.propertyView,
          description: state.data.description,
          priceRent: state.data.priceRent,
          priceSale: state.data.priceSale,
          securityDeposit: state.data.securityDeposit,
          maintenance: state.data.maintenance,
          negotiable: state.data.negotiable,
          brokerageDisclosed: state.data.brokerageDisclosed,
          amenities: Object.fromEntries(state.data.amenities.map((a) => [a, true])),
          restrictions: state.data.restrictions,
          photos: state.data.photos.map((p) => ({
            url: p.url,
            isCover: p.isCover,
            order: p.order,
          })),
        };
        await propertiesApi.create(payload);
        await clearDraft();
        dispatch({ type: 'RESET' });
        Alert.alert('Listed!', 'Your property is pending RWA approval.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }, [state.data, dispatch, router, onSubmitProp]);

  const idx = STEP_ORDER.indexOf(state.currentStep);
  const isLast = idx === STEP_ORDER.length - 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <ProgressBar current={state.currentStep} />
        <Text style={styles.stepTitle}>
          Step {idx + 1}/{STEP_ORDER.length} · {STEP_LABELS[state.currentStep]}
        </Text>
      </View>

      <View style={styles.body}>
        <StepRenderer step={state.currentStep} />
      </View>

      <View style={styles.footer}>
        {idx > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        {isLast ? (
          <Button
            title={submitting ? 'Submitting…' : onSubmitProp ? 'Save changes' : 'Submit listing'}
            onPress={submit}
            disabled={submitting}
            style={styles.primary}
          />
        ) : (
          <Button title="Continue" onPress={goNext} style={styles.primary} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

type PropertyWizardScreenProps = {
  /** Seed the wizard with existing property data (edit mode). */
  initialData?: Partial<WizardData>;
  /** Override the submit handler (edit mode). When omitted, propertiesApi.create is used. */
  onSubmit?: (data: WizardData) => Promise<void>;
};

export function PropertyWizardScreen({ initialData, onSubmit }: PropertyWizardScreenProps = {}) {
  return (
    <WizardProvider initialData={initialData}>
      <WizardInner onSubmit={onSubmit} />
    </WizardProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#fff' },
  progressRow: { flexDirection: 'row', marginBottom: 8 },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    marginRight: 4,
  },
  progressSegActive: { backgroundColor: '#2563eb' },
  stepTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  body: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  primary: { flex: 1 },
});
