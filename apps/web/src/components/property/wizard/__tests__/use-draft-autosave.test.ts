import { renderHook, act } from '@testing-library/react';
import { useDraftAutosave, draftKey, loadDraft } from '../use-draft-autosave';
import { INITIAL_DATA } from '../wizard-types';

describe('useDraftAutosave', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('writes the draft to localStorage after the autosave interval', () => {
    const data = { ...INITIAL_DATA, flatNumber: 'A-101', societyId: 'soc-1' };
    renderHook(() => useDraftAutosave({ userId: 'u-1', data, isDirty: true, intervalMs: 5000 }));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    const stored = loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'A-101' });
    expect(stored).toEqual(data);
  });

  it('does not write when isDirty is false', () => {
    const data = { ...INITIAL_DATA, flatNumber: 'A-101', societyId: 'soc-1' };
    renderHook(() => useDraftAutosave({ userId: 'u-1', data, isDirty: false, intervalMs: 5000 }));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    const stored = loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'A-101' });
    expect(stored).toBeNull();
  });

  it('keys drafts so two flats do not collide', () => {
    const data1 = { ...INITIAL_DATA, flatNumber: 'A-101', societyId: 'soc-1', bhk: 2 };
    const data2 = { ...INITIAL_DATA, flatNumber: 'B-202', societyId: 'soc-1', bhk: 3 };
    renderHook(() =>
      useDraftAutosave({ userId: 'u-1', data: data1, isDirty: true, intervalMs: 5000 }),
    );
    renderHook(() =>
      useDraftAutosave({ userId: 'u-1', data: data2, isDirty: true, intervalMs: 5000 }),
    );
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'A-101' })?.bhk).toBe(2);
    expect(loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'B-202' })?.bhk).toBe(3);
  });
});

// keep import referenced to avoid unused-import lint warning
void draftKey;
