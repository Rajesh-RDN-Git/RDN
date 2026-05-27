import { apiClient } from '../api-client';

export type ConsentPurpose = 'CORE_SERVICE' | 'MARKETING' | 'ANALYTICS' | 'THIRD_PARTY';

export const consentApi = {
  current: () => apiClient.get('/users/me/consent'),
  history: () => apiClient.get('/users/me/consent/history'),
  grant: (purpose: ConsentPurpose, granted: boolean, policyVersion = '1.0') =>
    apiClient.post('/users/me/consent', { purpose, granted, policyVersion }),
  exportData: () => apiClient.get('/users/me/data-export'),
};

export type DpdpCategory =
  | 'DATA_ACCESS'
  | 'DATA_ERASURE'
  | 'DATA_CORRECTION'
  | 'CONSENT_WITHDRAWAL'
  | 'DPDP_OTHER';

export const dpdpGrievanceApi = {
  submit: (category: DpdpCategory, description: string, contact?: string) =>
    apiClient.post('/grievance/dpdp', { category, description, contact }),
};
