'use client';

import { useEffect, useRef } from 'react';
import { WizardData } from './wizard-types';

type DraftKeyParts = { userId: string; societyId: string; flatNumber: string };

export function draftKey({ userId, societyId, flatNumber }: DraftKeyParts) {
  return `rdn:property-draft:${userId}:${societyId}:${flatNumber}`;
}

export function loadDraft(parts: DraftKeyParts): WizardData | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(draftKey(parts));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WizardData;
  } catch {
    return null;
  }
}

export function clearDraft(parts: DraftKeyParts) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(draftKey(parts));
}

type Args = {
  userId: string;
  data: WizardData;
  isDirty: boolean;
  intervalMs?: number;
};

export function useDraftAutosave({ userId, data, isDirty, intervalMs = 5000 }: Args) {
  const dataRef = useRef(data);
  const dirtyRef = useRef(isDirty);
  dataRef.current = data;
  dirtyRef.current = isDirty;

  useEffect(() => {
    const id = setInterval(() => {
      if (!dirtyRef.current) return;
      const d = dataRef.current;
      if (!d.societyId || !d.flatNumber) return;
      window.localStorage.setItem(
        draftKey({ userId, societyId: d.societyId, flatNumber: d.flatNumber }),
        JSON.stringify(d),
      );
    }, intervalMs);
    return () => clearInterval(id);
  }, [userId, intervalMs]);
}
