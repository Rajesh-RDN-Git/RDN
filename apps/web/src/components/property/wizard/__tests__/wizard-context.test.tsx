import { renderHook, act } from '@testing-library/react';
import { WizardProvider, useWizard } from '../wizard-context';
import { INITIAL_DATA } from '../wizard-types';

describe('WizardProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WizardProvider>{children}</WizardProvider>
  );

  it('initializes at the basics step with empty data', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    expect(result.current.state.currentStep).toBe('basics');
    expect(result.current.state.data).toEqual(INITIAL_DATA);
    expect(result.current.state.isDirty).toBe(false);
  });

  it('updates a field via SET_FIELD and marks dirty', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'SET_FIELD', field: 'flatNumber', value: 'A-101' });
    });
    expect(result.current.state.data.flatNumber).toBe('A-101');
    expect(result.current.state.isDirty).toBe(true);
  });

  it('navigates between steps via GOTO_STEP', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'GOTO_STEP', step: 'specs' });
    });
    expect(result.current.state.currentStep).toBe('specs');
  });

  it('loads a draft and resets isDirty', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    const draft = { ...INITIAL_DATA, flatNumber: 'B-202', societyId: 'soc-1' };
    act(() => {
      result.current.dispatch({ type: 'LOAD_DRAFT', data: draft });
    });
    expect(result.current.state.data.flatNumber).toBe('B-202');
    expect(result.current.state.isDirty).toBe(false);
    expect(result.current.state.draftLoadedAt).toBeDefined();
  });
});
