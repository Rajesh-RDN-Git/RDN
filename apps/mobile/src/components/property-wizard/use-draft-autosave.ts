import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { WizardData } from './wizard-types';

const KEY = 'property_wizard_draft_v1';
const DEBOUNCE_MS = 1500;

export function useDraftAutosave(data: WizardData, isDirty: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // expo-secure-store has ~2 KB limit; photos store remote URLs not blobs so we stay under.
      try {
        const json = JSON.stringify(data);
        if (json.length < 2000) {
          void SecureStore.setItemAsync(KEY, json);
        }
      } catch {
        /* drop draft on serialise failure */
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, isDirty]);
}

export async function loadDraft(): Promise<WizardData | null> {
  try {
    const json = await SecureStore.getItemAsync(KEY);
    return json ? (JSON.parse(json) as WizardData) : null;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* ignore */
  }
}
