'use client';

import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { INITIAL_DATA, WizardAction, WizardState } from './wizard-types';

const INITIAL_STATE: WizardState = {
  currentStep: 'basics',
  data: INITIAL_DATA,
  errors: {},
  isDirty: false,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        isDirty: true,
      };
    case 'SET_PHOTOS':
      return { ...state, data: { ...state.data, photos: action.photos }, isDirty: true };
    case 'GOTO_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'LOAD_DRAFT':
      return {
        ...state,
        data: action.data,
        isDirty: false,
        draftLoadedAt: Date.now(),
      };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

type WizardContextValue = {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return <WizardContext.Provider value={{ state, dispatch }}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider');
  return ctx;
}
