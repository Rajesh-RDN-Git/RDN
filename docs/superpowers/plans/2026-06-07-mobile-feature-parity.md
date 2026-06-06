# Mobile Feature-Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `apps/mobile` (Expo / React Native) to full feature parity with `apps/web` + the NestJS API across 14 capability areas, leaving no gaps.

**Architecture:** Add/extend axios API client libs in `src/lib/api/`, add one shared `CertificationStatus` enum to `packages/shared`, build a small set of reusable mobile-native primitives (BottomSheet, ActionSheet, DatePickerField), then add/extend Expo Router screens. New admin/secondary surfaces are reached through a role-gated "Manage" hub on the Profile tab; CRM and search extend existing tabs. Role gating reuses the existing `useAuthStore`; the API enforces RolesGuard regardless.

**Tech Stack:** TypeScript, Expo SDK 50+, Expo Router, axios, zustand, `@react-native-community/datetimepicker` (added), RN `Modal` for sheets, Maestro for e2e.

**Spec:** `docs/superpowers/specs/2026-06-07-mobile-feature-parity-design.md`

---

## Testing approach (read first)

`apps/mobile` has **no unit-test runner** (no jest, no testing-library). The established verification pattern is:

1. `pnpm --filter @rdn/mobile typecheck` (`tsc --noEmit`) — must pass.
2. `pnpm --filter @rdn/mobile lint` (eslint, autofix) — must pass.
3. Maestro flows in `apps/mobile/.maestro/flows/` for end-to-end (run against a running app/EAS build; authoring them is in scope, executing against a real artifact is a separate manual step).

So tasks here are **not** TDD unit cycles. Each task's verification = typecheck + lint pass, plus (where specified) a Maestro flow file. Do not add jest. Follow the existing screen idiom: function component, inline `StyleSheet.create`, axios call unwrapping `data.data || data` then `result.data` for lists, role via `useAuthStore()`.

**Workspace filter name:** confirm the mobile package name in `apps/mobile/package.json` (`name` field). Examples below use `@rdn/mobile`; if it differs, substitute it in every `pnpm --filter` command.

**Commit convention:** Conventional Commits. End each commit body with:

```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

---

## File Structure Map

**Created:**

- `apps/mobile/src/lib/api/commission.ts` — commission API lib
- `apps/mobile/src/lib/api/grievance.ts` — general grievance API lib
- `apps/mobile/src/lib/api/transactions.ts` — transactions API lib
- `apps/mobile/src/lib/api/reports.ts` — reports API lib
- `apps/mobile/src/lib/api/verification.ts` — verification-queue + society/dealer verify
- `apps/mobile/src/lib/api/users.ts` — profile update
- `apps/mobile/src/lib/shortlist.ts` — AsyncStorage saved-property helper
- `apps/mobile/src/components/ui/BottomSheet.tsx` — slide-up sheet primitive
- `apps/mobile/src/components/ui/ActionSheet.tsx` — action list sheet
- `apps/mobile/src/components/ui/DatePickerField.tsx` — date field wrapper
- `apps/mobile/src/components/ui/SaveButton.tsx` — heart toggle
- `apps/mobile/app/commissions/index.tsx`, `apps/mobile/app/commissions/[id].tsx`
- `apps/mobile/app/grievances/index.tsx`, `new.tsx`, `[id].tsx`
- `apps/mobile/app/transactions/index.tsx`, `[id].tsx`
- `apps/mobile/app/reports/index.tsx`
- `apps/mobile/app/saved/index.tsx`
- `apps/mobile/app/property/[id]/edit.tsx`
- `apps/mobile/app/manage/properties/index.tsx`
- `apps/mobile/app/manage/dealers/index.tsx`, `[id].tsx`
- `apps/mobile/app/manage/societies/index.tsx`, `new.tsx`, `[id].tsx`
- `apps/mobile/app/manage/verification-queue/index.tsx`
- `apps/mobile/app/settings/edit-profile.tsx`, `notification-preferences.tsx`, `security.tsx`
- `apps/mobile/.maestro/flows/06..12-*.yaml`

**Modified:**

- `packages/shared/src/types/dealer.ts` — add `CertificationStatus`
- `apps/mobile/src/lib/api/index.ts` — export new libs
- `apps/mobile/src/lib/api/dealers.ts` — admin methods
- `apps/mobile/src/lib/api/communication.ts` — `call`
- `apps/mobile/src/lib/api/search.ts` — advanced filter params
- `apps/mobile/src/lib/api/societies.ts` — create/update
- `apps/mobile/src/lib/api/properties.ts` — verification-queue + verification PATCH (or via verification.ts)
- `apps/mobile/app/(tabs)/leads.tsx` — full status set + priority
- `apps/mobile/app/lead/[id].tsx` — action sheets, plan visit, close deal, approve, call, grievance
- `apps/mobile/app/(tabs)/search.tsx` — advanced filters + save heart
- `apps/mobile/app/(tabs)/profile.tsx` — Manage hub
- `apps/mobile/app/property/[id].tsx` — save heart + raise-grievance entry
- `apps/mobile/package.json` — datetimepicker, async-storage (if missing)

---

# Phase 1 — Foundation (shared enum, API libs, UI primitives)

No UI screens here. Everything later depends on this phase.

### Task 1.1: Add `CertificationStatus` to shared types

**Files:**

- Modify: `packages/shared/src/types/dealer.ts`

- [ ] **Step 1: Add the enum**

Open `packages/shared/src/types/dealer.ts`. Confirm existing enums (`KYCStatus`, `ApprovalStatus`, `TrainingStatus`) are declared as `export const X = {...} as const` + `export type X` OR TS `enum` — match whichever style the file already uses. Add, in the same style:

```ts
export const CertificationStatus = {
  NOT_CERTIFIED: 'NOT_CERTIFIED',
  CERTIFIED: 'CERTIFIED',
  REVOKED: 'REVOKED',
} as const;
export type CertificationStatus = (typeof CertificationStatus)[keyof typeof CertificationStatus];
```

(If the file uses native `enum`, instead write `export enum CertificationStatus { NOT_CERTIFIED = 'NOT_CERTIFIED', CERTIFIED = 'CERTIFIED', REVOKED = 'REVOKED' }`.)

- [ ] **Step 2: Ensure it is re-exported**

Check `packages/shared/src/types/index.ts` (or `packages/shared/src/index.ts`) re-exports everything from `dealer.ts` already (it will if other dealer enums are exported). If `CertificationStatus` is not surfaced by the barrel, add `export * from './types/dealer';` is already present — no action. Verify by grep.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @rdn/shared typecheck` (or `pnpm --filter @rdn/shared build` if that is the check).
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/dealer.ts
git commit -m "feat(shared): add CertificationStatus enum"
```

### Task 1.2: Install native deps

**Files:**

- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Add datetimepicker + async-storage**

From `apps/mobile/`:

```bash
cd apps/mobile && npx expo install @react-native-community/datetimepicker @react-native-async-storage/async-storage
```

(`@react-native-async-storage/async-storage` may already be transitively present — `npx expo install` is idempotent and pins the Expo-compatible version. The property wizard already uses AsyncStorage per the spec, so it is likely present; running this guarantees a direct dependency entry.)

- [ ] **Step 2: Verify**

Run: `pnpm --filter @rdn/mobile typecheck`
Expected: PASS (no usage yet).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): add datetimepicker + async-storage deps"
```

### Task 1.3: Commission + grievance + transactions + reports + verification + users libs

**Files:**

- Create: `apps/mobile/src/lib/api/commission.ts`, `grievance.ts`, `transactions.ts`, `reports.ts`, `verification.ts`, `users.ts`
- Modify: `apps/mobile/src/lib/api/dealers.ts`, `communication.ts`, `search.ts`, `societies.ts`, `index.ts`

- [ ] **Step 1: commission.ts**

```ts
import { apiClient } from '../api-client';

export const commissionApi = {
  list: (params?: Record<string, string>) => apiClient.get('/commissions', { params }),
  getById: (id: string) => apiClient.get(`/commissions/${id}`),
  settle: (id: string, data: { paymentMethod: string; paymentReference: string }) =>
    apiClient.post(`/commissions/${id}/settle`, data),
  distribute: (id: string) => apiClient.post(`/commissions/${id}/distribute`),
  cancel: (id: string, data: { reason: string }) =>
    apiClient.post(`/commissions/${id}/cancel`, data),
};
```

- [ ] **Step 2: grievance.ts**

```ts
import { apiClient } from '../api-client';

export const grievanceApi = {
  list: (params?: Record<string, string>) => apiClient.get('/grievances', { params }),
  getById: (id: string) => apiClient.get(`/grievances/${id}`),
  create: (data: {
    category: string;
    severity: string;
    description: string;
    evidenceUrls?: string[];
    relatedLeadId?: string;
    relatedPropertyId?: string;
  }) => apiClient.post('/grievances', data),
  update: (id: string, data: { status?: string; resolutionNotes?: string }) =>
    apiClient.patch(`/grievances/${id}`, data),
  escalate: (id: string) => apiClient.post(`/grievances/${id}/escalate`),
};
```

(Confirm the create payload field names against `apps/api/src/modules/grievance/dto/*.ts` while implementing; adjust keys to match the DTO exactly.)

- [ ] **Step 3: transactions.ts**

```ts
import { apiClient } from '../api-client';

export const transactionsApi = {
  list: (params?: Record<string, string>) => apiClient.get('/transactions', { params }),
  getById: (id: string) => apiClient.get(`/transactions/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/transactions', data),
  updatePaymentStatus: (id: string, data: { paymentStatus: string }) =>
    apiClient.patch(`/transactions/${id}/payment-status`, data),
};
```

- [ ] **Step 4: reports.ts**

```ts
import { apiClient } from '../api-client';

export const reportsApi = {
  dashboard: () => apiClient.get('/reports/dashboard'),
  leads: (params?: Record<string, string>) => apiClient.get('/reports/leads', { params }),
  transactions: (params?: Record<string, string>) =>
    apiClient.get('/reports/transactions', { params }),
  commissions: (params?: Record<string, string>) =>
    apiClient.get('/reports/commissions', { params }),
};
```

- [ ] **Step 5: verification.ts**

```ts
import { apiClient } from '../api-client';

export const verificationApi = {
  propertyQueue: (params?: Record<string, string>) =>
    apiClient.get('/properties/verification-queue', { params }),
  decideProperty: (id: string, data: { decision: 'APPROVED' | 'REJECTED'; notes?: string }) =>
    apiClient.patch(`/properties/${id}/verification`, data),
  verifySociety: (id: string, data: { status: string; notes?: string }) =>
    apiClient.post(`/verification/society/${id}`, data),
  verifyDealer: (id: string, data?: Record<string, unknown>) =>
    apiClient.post(`/verification/dealer/${id}`, data ?? {}),
};
```

(Confirm `decideProperty` body shape against `properties.controller.ts` `PATCH :id/verification` DTO; match field names exactly.)

- [ ] **Step 6: users.ts**

```ts
import { apiClient } from '../api-client';

export const usersApi = {
  me: () => apiClient.get('/users/me'),
  updateMe: (data: { name?: string; email?: string; avatarUrl?: string }) =>
    apiClient.patch('/users/me', data),
};
```

- [ ] **Step 7: extend dealers.ts** — append to the `dealersApi` object:

```ts
  approve: (id: string) => apiClient.patch(`/dealers/${id}/approve`),
  reject: (id: string, data?: { reason?: string }) =>
    apiClient.patch(`/dealers/${id}/reject`, data ?? {}),
  updateKyc: (id: string, data: { status: 'APPROVED' | 'REJECTED' }) =>
    apiClient.patch(`/dealers/${id}/kyc`, data),
  trainingComplete: (id: string) => apiClient.patch(`/dealers/${id}/training-complete`),
  setActive: (id: string, data: { active: boolean }) =>
    apiClient.patch(`/dealers/${id}/active`, data),
  certify: (id: string) => apiClient.patch(`/dealers/${id}/certify`),
  revokeCertification: (id: string) => apiClient.patch(`/dealers/${id}/revoke-certification`),
```

(Verify each body shape against `dealers.controller.ts` DTOs; e.g. `active` and `kyc` payload keys.)

- [ ] **Step 8: extend communication.ts** — add to `communicationApi`:

```ts
  call: (data: { leadId: string }) => apiClient.post('/communication/call', data),
```

(Confirm the call DTO — it may take `leadId` or `conversationId`/`toUserId`; match `communication.controller.ts`.)

- [ ] **Step 9: extend search.ts** — widen the params type to include advanced filters. Current lib calls `GET /search/properties`. Ensure it forwards: `minPrice, maxPrice, minArea, maxArea, amenities, furnishing, societyId` in addition to existing `city, transactionType, type, bhk, sortBy, sortDir, page, limit`. If the lib already passes a generic `params` record, no signature change is needed — just confirm it targets `/search/properties` (not `/search`).

- [ ] **Step 10: extend societies.ts** — add:

```ts
  create: (data: Record<string, unknown>) => apiClient.post('/societies', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/societies/${id}`, data),
```

- [ ] **Step 11: register in index.ts** — add exports:

```ts
export { commissionApi } from './commission';
export { grievanceApi } from './grievance';
export { transactionsApi } from './transactions';
export { reportsApi } from './reports';
export { verificationApi } from './verification';
export { usersApi } from './users';
```

- [ ] **Step 12: Verify**

Run: `pnpm --filter @rdn/mobile typecheck && pnpm --filter @rdn/mobile lint`
Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add apps/mobile/src/lib/api
git commit -m "feat(mobile): add commission/grievance/transactions/reports/verification/users API libs + dealer-admin & call methods"
```

### Task 1.4: Shortlist helper

**Files:**

- Create: `apps/mobile/src/lib/shortlist.ts`

- [ ] **Step 1: Implement**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rdn_shortlist';

export async function getShortlist(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    /* storage unavailable */
    return [];
  }
}

export async function isSaved(id: string): Promise<boolean> {
  return (await getShortlist()).includes(id);
}

export async function toggleSaved(id: string): Promise<boolean> {
  const ids = await getShortlist();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next.includes(id);
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @rdn/mobile typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/shortlist.ts
git commit -m "feat(mobile): AsyncStorage shortlist helper (mirrors web rdn_shortlist)"
```

### Task 1.5: BottomSheet + ActionSheet primitives

**Files:**

- Create: `apps/mobile/src/components/ui/BottomSheet.tsx`, `apps/mobile/src/components/ui/ActionSheet.tsx`

- [ ] **Step 1: BottomSheet.tsx**

```tsx
import { ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  close: { fontSize: 18, color: '#6b7280' },
});
```

- [ ] **Step 2: ActionSheet.tsx** (built on BottomSheet)

```tsx
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';

export type SheetAction = { label: string; onPress: () => void; destructive?: boolean };

export function ActionSheet({
  visible,
  onClose,
  title,
  actions,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          style={styles.row}
          onPress={() => {
            onClose();
            a.onPress();
          }}
        >
          <Text style={[styles.label, a.destructive && styles.destructive]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { fontSize: 16, color: '#111827' },
  destructive: { color: '#ef4444' },
});
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @rdn/mobile typecheck && pnpm --filter @rdn/mobile lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/BottomSheet.tsx apps/mobile/src/components/ui/ActionSheet.tsx
git commit -m "feat(mobile): BottomSheet + ActionSheet primitives"
```

### Task 1.6: DatePickerField + SaveButton

**Files:**

- Create: `apps/mobile/src/components/ui/DatePickerField.tsx`, `apps/mobile/src/components/ui/SaveButton.tsx`

- [ ] **Step 1: DatePickerField.tsx**

```tsx
import { useState } from 'react';
import { Platform, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)}>
        <Text style={styles.value}>
          {value ? value.toLocaleDateString('en-IN') : 'Select date'}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          minimumDate={minimumDate}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_e, d) => {
            setShow(Platform.OS === 'ios');
            if (d) onChange(d);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  field: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  value: { fontSize: 15, color: '#111827' },
});
```

- [ ] **Step 2: SaveButton.tsx**

```tsx
import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { isSaved, toggleSaved } from '@/lib/shortlist';

export function SaveButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    isSaved(propertyId).then(setSaved);
  }, [propertyId]);
  return (
    <TouchableOpacity
      style={styles.btn}
      hitSlop={10}
      onPress={async () => setSaved(await toggleSaved(propertyId))}
    >
      <Text style={[styles.heart, saved && styles.heartOn]}>{saved ? '♥' : '♡'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 6 },
  heart: { fontSize: 22, color: '#9ca3af' },
  heartOn: { color: '#ef4444' },
});
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @rdn/mobile typecheck && pnpm --filter @rdn/mobile lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/DatePickerField.tsx apps/mobile/src/components/ui/SaveButton.tsx
git commit -m "feat(mobile): DatePickerField + SaveButton UI primitives"
```

---

# Phase 2 — CRM pipeline (#1) + masked call (#11)

### Task 2.1: Expand lead status filters + priority badges

**Files:**

- Modify: `apps/mobile/app/(tabs)/leads.tsx`

- [ ] **Step 1: Replace the `STATUSES` and `statusColors` constants**

```ts
const STATUSES = [
  'ALL',
  'NEW',
  'CONTACTED',
  'NOT_PICKED',
  'INTERESTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'VISITED',
  'NEGOTIATING',
  'MEETING_ARRANGED',
  'DEAL_OPEN',
  'CLOSING',
  'CLOSED',
  'LOST',
];

const statusColors: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#8b5cf6',
  NOT_PICKED: '#6b7280',
  INTERESTED: '#0ea5e9',
  QUALIFIED: '#14b8a6',
  VISIT_SCHEDULED: '#f59e0b',
  VISITED: '#eab308',
  NEGOTIATING: '#f97316',
  MEETING_ARRANGED: '#a855f7',
  DEAL_OPEN: '#ec4899',
  CLOSING: '#ef4444',
  CLOSED: '#10b981',
  LOST: '#9ca3af',
};
```

- [ ] **Step 2: Add a priority badge** — define a helper near the top and render it in `renderLead` next to the status badge:

```ts
function priorityOf(status: string): { label: string; color: string } | null {
  if (['NEGOTIATING', 'MEETING_ARRANGED', 'DEAL_OPEN', 'CLOSING'].includes(status))
    return { label: 'HOT', color: '#ef4444' };
  if (['INTERESTED', 'QUALIFIED', 'VISIT_SCHEDULED', 'VISITED'].includes(status))
    return { label: 'WARM', color: '#f59e0b' };
  if (['NEW', 'CONTACTED'].includes(status)) return { label: 'COLD', color: '#3b82f6' };
  return null;
}
```

Render inside `leadHeader` (mirror existing `statusBadge` styling; use `priorityOf(item.status)`). Match web's HOT/WARM/COLD mapping — cross-check `apps/web/src/app/dashboard/leads/page.tsx` and align buckets if it differs.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @rdn/mobile typecheck && pnpm --filter @rdn/mobile lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/app/(tabs)/leads.tsx"
git commit -m "feat(mobile): full CRM status filters + priority badges on leads list"
```

### Task 2.2: Lead detail actions — transition, plan visit, close deal, approve, call, grievance

**Files:**

- Modify: `apps/mobile/app/lead/[id].tsx`

Read the current file first; it already has a status timeline and a "Move to [next]" button. Replace the single move button with role-aware actions driven by `ActionSheet`/`BottomSheet`.

- [ ] **Step 1: Add imports & state**

```tsx
import { ActionSheet, SheetAction } from '@/components/ui/ActionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { leadsApi } from '@/lib/api/leads';
import { communicationApi } from '@/lib/api/communication';
```

State: `const [sheet, setSheet] = useState<null | 'status' | 'visit' | 'deal'>(null);` plus `visitDate`, `dealType`, `dealValue`.

- [ ] **Step 2: Status transition action sheet**

Define the allowed next statuses (full enum minus terminal) and call `leadsApi.update(id, { status })` then refetch. Build `SheetAction[]` from the enum. Dealer/admin only (`['DEALER','SUPER_ADMIN','RWA_ADMIN'].includes(user.role)`).

- [ ] **Step 3: Plan Visit bottom sheet**

```tsx
<BottomSheet visible={sheet === 'visit'} onClose={() => setSheet(null)} title="Plan a visit">
  <DatePickerField
    label="Visit date"
    value={visitDate}
    onChange={setVisitDate}
    minimumDate={new Date()}
  />
  <Button
    title="Schedule visit"
    onPress={async () => {
      await leadsApi.update(id, {
        status: 'VISIT_SCHEDULED',
        visitScheduledAt: visitDate?.toISOString(),
      });
      setSheet(null);
      await load();
    }}
  />
</BottomSheet>
```

(Confirm the visit-date field name on the lead `PATCH` DTO; adjust `visitScheduledAt`.)

- [ ] **Step 4: Close Deal bottom sheet**

Deal type chips (RENT/SALE/RENEWAL) + numeric value input → `leadsApi.closeDeal(id, { type: dealType, dealValue: Number(dealValue) })`. Show only when status is in `['NEGOTIATING','MEETING_ARRANGED','DEAL_OPEN','CLOSING']` and role is DEALER/SUPER_ADMIN.

- [ ] **Step 5: Owner Approve Visit**

When `user.role === 'OWNER'` and lead status is `VISIT_SCHEDULED` (pending owner approval), render a "Approve visit" button → `leadsApi.approveVisit(id)` then refetch.

- [ ] **Step 6: Masked call**

When `user.role === 'DEALER'`, render a "Call (masked)" button → `communicationApi.call({ leadId: id })`; on success toast "Connecting your call…". Number never displayed.

- [ ] **Step 7: Raise grievance entry**

Add a secondary "Raise grievance" link → `router.push({ pathname: '/grievances/new', params: { relatedLeadId: id } })`. (Screen built in Phase 3; link can exist now.)

- [ ] **Step 8: Verify**

Run: `pnpm --filter @rdn/mobile typecheck && pnpm --filter @rdn/mobile lint`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add "apps/mobile/app/lead/[id].tsx"
git commit -m "feat(mobile): lead detail CRM actions — transition, plan visit, close deal, approve, masked call"
```

---

# Phase 3 — General grievance (#4)

### Task 3.1: Grievance file screen

**Files:**

- Create: `apps/mobile/app/grievances/new.tsx`

- [ ] **Step 1: Implement** — model structure after an existing form screen (`apps/mobile/app/become-dealer.tsx` for layout, `app/settings/grievance.tsx` for category-chip pattern). Fields:
  - Category chips: `DEALER_CONDUCT, PROPERTY_MISMATCH, COMMISSION, SERVICE, SAFETY, KEY_ARRANGEMENT, VISIT_TIME, MEETING_AVAILABILITY, OTHER`
  - Severity chips: `CRITICAL, HIGH, MEDIUM, LOW`
  - Description `TextInput` (multiline, min 10 chars)
  - Evidence: reuse `MediaUploader` (`src/components/MediaUploader.tsx`), collect returned URLs into `evidenceUrls`
  - Read `useLocalSearchParams()` for optional `relatedLeadId` / `relatedPropertyId` and include in payload
  - Submit → `grievanceApi.create({ category, severity, description, evidenceUrls, relatedLeadId, relatedPropertyId })` → on success `router.replace('/grievances')`
- [ ] **Step 2: Verify** — `pnpm --filter @rdn/mobile typecheck && pnpm --filter @rdn/mobile lint` → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): file general grievance screen"`

### Task 3.2: Grievance list (dual view) + detail

**Files:**

- Create: `apps/mobile/app/grievances/index.tsx`, `apps/mobile/app/grievances/[id].tsx`

- [ ] **Step 1: List** — copy `app/(tabs)/leads.tsx` structure. Status filter chips `ALL/OPEN/IN_PROGRESS/ESCALATED/RESOLVED/CLOSED`. `grievanceApi.list(params)`. Each card shows category, severity badge, status, date, filer name (admins). Header button "File grievance" → `/grievances/new`. Tap → `/grievances/{id}`.
- [ ] **Step 2: Detail** — show category/severity/description/status/resolutionNotes. Actions:
  - Any user: **Escalate** → `grievanceApi.escalate(id)`.
  - `SUPER_ADMIN`/`RWA_ADMIN`: ActionSheet — Mark In Progress (`update(id,{status:'IN_PROGRESS'})`), Resolve (BottomSheet with notes → `update(id,{status:'RESOLVED', resolutionNotes})`), Close (BottomSheet with reason → `update(id,{status:'CLOSED', resolutionNotes:reason})`).
- [ ] **Step 3: Verify** — typecheck + lint → PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(mobile): grievance list (dual view) + detail with triage actions"`

### Task 3.3: Maestro flow — grievance file

**Files:**

- Create: `apps/mobile/.maestro/flows/07-grievance-file.yaml`

- [ ] **Step 1:** Model after `.maestro/flows/05-grievance-submit.yaml` (DPDP one). Steps: launch → login (reuse `01-login` pattern) → navigate Profile → Manage → Grievances → File grievance → pick category/severity → type description → submit → assert it appears in list.
- [ ] **Step 2: Commit** — `git commit -m "test(mobile): maestro flow for general grievance filing"`

---

# Phase 4 — Saved/shortlist (#7) + advanced search filters (#9)

### Task 4.1: Save hearts on cards + property detail

**Files:**

- Modify: `apps/mobile/app/(tabs)/search.tsx`, `apps/mobile/app/property/[id].tsx`, `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1:** Add `<SaveButton propertyId={item.id} />` to each property card in `search.tsx` and home recent-listings, positioned top-right of the card. In `property/[id].tsx`, add `SaveButton` to the header area. Also add a "Raise grievance" link in `property/[id].tsx` → `router.push({ pathname: '/grievances/new', params: { relatedPropertyId: id } })`.
- [ ] **Step 2: Verify** — typecheck + lint → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): save-property hearts + raise-grievance entry on listings"`

### Task 4.2: Saved list screen

**Files:**

- Create: `apps/mobile/app/saved/index.tsx`

- [ ] **Step 1:** Mirror web `saved-properties.tsx` logic: `getShortlist()` → `Promise.allSettled(ids.map(id => propertiesApi.getById(id)))` → render cards (reuse the card markup from `search.tsx`). Empty state when no saves. Works without auth.
- [ ] **Step 2: Verify** — typecheck + lint → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): saved properties list screen"`

### Task 4.3: Advanced search filters

**Files:**

- Modify: `apps/mobile/app/(tabs)/search.tsx`

- [ ] **Step 1:** Add a "Filters" button opening a `BottomSheet` with: price range (min/max numeric inputs), area range (min/max), furnishing chips (FURNISHED/SEMI_FURNISHED/UNFURNISHED), amenities multi-select (reuse the amenity list from the property wizard's `AMENITIES_OPTIONS`), society picker (load via `societiesApi.list`). Pass selected values as params to `searchApi.search(params)` alongside existing filters. Show applied-filter chips with one-tap removal (mirror the existing chip pattern).
- [ ] **Step 2: Verify** — typecheck + lint → PASS. Cross-check param names against `apps/api/src/modules/search/dto/*` and align.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): advanced search filters (price/area/furnishing/amenities/society)"`

---

# Phase 5 — Property management list (#5) + edit (#6)

### Task 5.1: Property management list

**Files:**

- Create: `apps/mobile/app/manage/properties/index.tsx`

- [ ] **Step 1:** Copy `leads.tsx` structure. Role-scoped fetch via `propertiesApi.list(params)` (API already scopes by role/token). Status filter chips matching the property status enum (check `packages/shared` `PropertyStatus`). Search input (flat/tower/society). Each row → `/property/{id}`; for OWNER (own) / SUPER_ADMIN / RWA_ADMIN show inline **Edit** (→ `/property/{id}/edit`) and **Delist** (→ `propertiesApi.delist(id)` with confirm).
- [ ] **Step 2: Verify** — typecheck + lint → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): property management list (role-scoped, filter, search)"`

### Task 5.2: Property edit (wizard in edit mode)

**Files:**

- Create: `apps/mobile/app/property/[id]/edit.tsx`

- [ ] **Step 1:** Inspect the existing `property-wizard` (`src/components/property-wizard/`) — the spec says the web wizard supports an edit/prefill mode; check the mobile `WizardProvider`/`wizard-context.tsx` for an `initialData` prop. Load `propertiesApi.getById(id)`, map the record to `WizardData`, render `PropertyWizard` seeded with it, and on submit call `propertiesApi.update(id, data)` instead of `create`. If the wizard does not accept initial data, add an optional `initialData?: Partial<WizardData>` prop to `WizardProvider` and seed the reducer's initial state from it (the only wizard change needed).
- [ ] **Step 2: Verify** — typecheck + lint → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): property edit via wizard edit-mode"`

### Task 5.3: Maestro flow — property edit

**Files:**

- Create: `apps/mobile/.maestro/flows/09-property-edit.yaml`

- [ ] **Step 1:** login (OWNER) → Manage → My Properties → tap a property → Edit → change a field → submit → assert success.
- [ ] **Step 2: Commit** — `git commit -m "test(mobile): maestro flow for property edit"`

---

# Phase 6 — Verification queue (#8)

### Task 6.1: Verification queue screen

**Files:**

- Create: `apps/mobile/app/manage/verification-queue/index.tsx`

- [ ] **Step 1:** RWA_ADMIN/SUPER_ADMIN only. `verificationApi.propertyQueue()` → list of pending listings (flat, tower, society, owner). Each row has **Approve** / **Reject** buttons → `verificationApi.decideProperty(id, { decision })` (Reject opens a BottomSheet for optional notes). Refetch on action. Empty state "No pending listings".
- [ ] **Step 2: Verify** — typecheck + lint → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): RWA verification queue (approve/reject listings)"`

### Task 6.2: Maestro flow — verification approve

**Files:**

- Create: `apps/mobile/.maestro/flows/10-verification-approve.yaml`

- [ ] **Step 1:** login (RWA_ADMIN) → Manage → Verification Queue → approve first item → assert it leaves the list.
- [ ] **Step 2: Commit** — `git commit -m "test(mobile): maestro flow for verification approve"`

---

# Phase 7 — Commission (#2) + transactions (#14)

### Task 7.1: Commission list + detail

**Files:**

- Create: `apps/mobile/app/commissions/index.tsx`, `apps/mobile/app/commissions/[id].tsx`

- [ ] **Step 1: List** — copy `leads.tsx` structure. Status filter `ALL/PENDING/SETTLED/DISTRIBUTED/CANCELLED`. `commissionApi.list(params)`. Card: dealer name, amount, GST, status badge, payout ref. Dealer sees own (API scopes); SUPER_ADMIN sees all. Tap → detail.
- [ ] **Step 2: Detail** — show full breakdown. For `SUPER_ADMIN`, an ActionSheet gated by status:
  - PENDING → **Settle** (BottomSheet: method chips UPI/IMPS/NEFT/RTGS/CASH + reference input → `commissionApi.settle(id,{paymentMethod,paymentReference})`) and **Cancel** (BottomSheet reason → `commissionApi.cancel(id,{reason})`).
  - SETTLED → **Mark Distributed** → `commissionApi.distribute(id)`.
    Refetch after each.
- [ ] **Step 3: Verify** — typecheck + lint → PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(mobile): commission list + detail with settle/distribute/cancel"`

### Task 7.2: Maestro flow — commission view + close-deal

**Files:**

- Create: `apps/mobile/.maestro/flows/06-commission-view.yaml`, `apps/mobile/.maestro/flows/08-lead-close-deal.yaml`

- [ ] **Step 1:** `06` — login (DEALER) → Manage → Commissions → assert list renders. `08` — login (DEALER) → Leads → open a NEGOTIATING lead → Close Deal → enter type+value → submit → assert status CLOSED.
- [ ] **Step 2: Commit** — `git commit -m "test(mobile): maestro flows for commission view + close deal"`

### Task 7.3: Transactions list + detail

**Files:**

- Create: `apps/mobile/app/transactions/index.tsx`, `apps/mobile/app/transactions/[id].tsx`

- [ ] **Step 1: List** — SUPER_ADMIN/RWA_ADMIN. `transactionsApi.list(params)` with type/status filter chips. Card: type, value, payment status, date, property/society. Tap → detail.
- [ ] **Step 2: Detail** — full record. SUPER_ADMIN: **Update payment status** ActionSheet → `transactionsApi.updatePaymentStatus(id,{paymentStatus})` (statuses per `TransactionPaymentStatus` enum — check schema).
- [ ] **Step 3: Verify** — typecheck + lint → PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(mobile): transactions list + detail with payment-status update"`

---

# Phase 8 — Dealer management (#3) + society management (#10)

### Task 8.1: Dealer management list + detail

**Files:**

- Create: `apps/mobile/app/manage/dealers/index.tsx`, `apps/mobile/app/manage/dealers/[id].tsx`

- [ ] **Step 1: List** — SUPER_ADMIN/RWA_ADMIN (RWA society-scoped, API enforces). `dealersApi.list(params)`. Card: dealer name, society, badges for KYC/RWA-approval/Training/Active/Certification (use `KYCStatus`, `ApprovalStatus`, `TrainingStatus`, `CertificationStatus` from `@rdn/shared`). Tap → detail.
- [ ] **Step 2: Detail** — state-gated ActionSheet:
  - PENDING application → **Approve** (`dealersApi.approve`) / **Reject** (`dealersApi.reject`).
  - KYC PENDING → **Approve KYC** / **Reject KYC** (`dealersApi.updateKyc(id,{status})`).
  - Training PENDING → **Mark training complete** (`dealersApi.trainingComplete`).
  - **Activate/Deactivate** (`dealersApi.setActive(id,{active})`).
  - Training COMPLETED && cert !== CERTIFIED → **Certify** (`dealersApi.certify`).
  - cert === CERTIFIED → **Revoke certification** (`dealersApi.revokeCertification`).
    Mirror visibility rules from `apps/web/src/app/dashboard/dealers/page.tsx`. Refetch after each.
- [ ] **Step 3: Verify** — typecheck + lint → PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(mobile): dealer management — approve/kyc/training/active/certify/revoke"`

### Task 8.2: Society management list + create + detail

**Files:**

- Create: `apps/mobile/app/manage/societies/index.tsx`, `new.tsx`, `[id].tsx`

- [ ] **Step 1: List** — SUPER_ADMIN. `societiesApi.list(params)`. Card: name, city, verification status badge, units. Header button "Add society" → `/manage/societies/new`. Tap → detail.
- [ ] **Step 2: Create** — form (name, slug, address, city, state, pincode, units, amenities multi-select) → `societiesApi.create(data)` → `router.replace('/manage/societies')`. Model after `become-dealer.tsx`/wizard form patterns.
- [ ] **Step 3: Detail** — show society info + verification status. Actions: **Verify** (BottomSheet: status VERIFIED/FLAGGED/REJECTED chips + notes → `verificationApi.verifySociety(id,{status,notes})`); **Assign/Reassign RWA admin** (BottomSheet: load eligible users via `usersApi`/admin users endpoint, pick one → `societiesApi.update(id,{rwaAdminId})`). Confirm the assign field name against `societies.controller.ts` PATCH DTO.
- [ ] **Step 4: Verify** — typecheck + lint → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(mobile): society management — list/create/verify/assign-RWA"`

---

# Phase 9 — Reports / analytics (#12)

### Task 9.1: Reports screen

**Files:**

- Create: `apps/mobile/app/reports/index.tsx`

- [ ] **Step 1:** Role-aware. Top: dashboard stat cards from `reportsApi.dashboard()` (reuse the `StatCard` component used on the home tab). For SUPER_ADMIN/RWA_ADMIN add a segmented control (simple chip row) switching report tabs:
  - Leads (`reportsApi.leads()`, SUPER_ADMIN + RWA) — by-status counts + conversion.
  - Transactions (`reportsApi.transactions()`, SUPER_ADMIN) — by-type count + total value.
  - Commissions (`reportsApi.commissions()`, SUPER_ADMIN) — by-status count + total amount.
    Render each as a simple list of labelled rows (no chart lib). Hide tabs the role can't access.
- [ ] **Step 2: Verify** — typecheck + lint → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): reports/analytics screen (dashboard + leads/txn/commission)"`

### Task 9.2: Maestro flow — reports view

**Files:**

- Create: `apps/mobile/.maestro/flows/12-reports-view.yaml`

- [ ] **Step 1:** login (SUPER_ADMIN) → Manage → Reports → assert stat cards render → switch to Commissions tab → assert content.
- [ ] **Step 2: Commit** — `git commit -m "test(mobile): maestro flow for reports view"`

---

# Phase 10 — Profile edit + preferences + security (#13)

### Task 10.1: Edit profile

**Files:**

- Create: `apps/mobile/app/settings/edit-profile.tsx`

- [ ] **Step 1:** Load `usersApi.me()`. Editable name + email `TextInput`s; masked phone read-only; avatar upload via existing media presigned flow (reuse `MediaUploader` single-image mode, store returned URL). Save → `usersApi.updateMe({name,email,avatarUrl})` → update `useAuthStore` user → toast. Model after `become-dealer.tsx`.
- [ ] **Step 2: Verify** — typecheck + lint → PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): edit profile (name/email/avatar)"`

### Task 10.2: Notification preferences + security

**Files:**

- Create: `apps/mobile/app/settings/notification-preferences.tsx`, `apps/mobile/app/settings/security.tsx`

- [ ] **Step 1: Notification preferences** — toggle rows (lead updates, deals, commissions, visits, announcements). Persist to the user-preferences endpoint if one exists (check `users.controller.ts` PATCH `/users/me` for a `notificationPreferences` field); otherwise store locally via AsyncStorage and note the limitation in a code comment. Model after `app/settings/consent.tsx` toggle pattern.
- [ ] **Step 2: Security** — read-only: "Phone OTP authentication" info + active sessions list if an endpoint exists (else show current-session-only note). Mirror web `settings` security tab content.
- [ ] **Step 3: Verify** — typecheck + lint → PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(mobile): notification preferences + security settings screens"`

---

# Phase 11 — Profile "Manage" hub wiring

### Task 11.1: Add role-gated Manage section to Profile

**Files:**

- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1:** Read the current profile menu structure (it already renders role-gated menu rows). Add a **Manage** section. Each row gated by `user.role`:

| Row                            | Roles                                               | Route                                |
| ------------------------------ | --------------------------------------------------- | ------------------------------------ |
| My Properties / Assigned / All | OWNER, DEALER, SUPER_ADMIN, RWA_ADMIN               | `/manage/properties`                 |
| Saved                          | BUYER_TENANT (and any)                              | `/saved`                             |
| Verification Queue             | RWA_ADMIN, SUPER_ADMIN                              | `/manage/verification-queue`         |
| Dealers                        | SUPER_ADMIN, RWA_ADMIN                              | `/manage/dealers`                    |
| Societies                      | SUPER_ADMIN                                         | `/manage/societies`                  |
| Commissions                    | SUPER_ADMIN, DEALER                                 | `/commissions`                       |
| Transactions                   | SUPER_ADMIN, RWA_ADMIN                              | `/transactions`                      |
| Grievances                     | all                                                 | `/grievances`                        |
| Reports                        | SUPER_ADMIN, RWA_ADMIN, DEALER, OWNER, BUYER_TENANT | `/reports`                           |
| Edit Profile                   | all                                                 | `/settings/edit-profile`             |
| Notification Preferences       | all                                                 | `/settings/notification-preferences` |
| Security                       | all                                                 | `/settings/security`                 |

Use the existing menu-row component/style. Keep existing DPDP rows.

- [ ] **Step 2: Verify** — typecheck + lint → PASS. Manually confirm each route resolves (Expo Router file exists for each).
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): role-gated Manage hub on profile linking all new surfaces"`

---

# Phase 12 — Final verification

### Task 12.1: Full typecheck + lint sweep

- [ ] **Step 1:** Run `pnpm --filter @rdn/mobile typecheck && pnpm --filter @rdn/mobile lint && pnpm --filter @rdn/shared typecheck`. Fix any errors.
- [ ] **Step 2:** Run `pnpm --filter @rdn/api typecheck` to confirm the shared enum change didn't break the API. Fix if needed.
- [ ] **Step 3: Commit** any fixes — `git commit -m "fix(mobile): resolve typecheck/lint after parity work"`

### Task 12.2: Parity self-audit

- [ ] **Step 1:** Re-walk the gap matrix in the spec (14 rows). For each, confirm the mobile screen/action now exists. Note any deferred item explicitly in the commit message.
- [ ] **Step 2:** Update memory: edit `project_mobile_phase0_4_done.md` (or add a new memory) recording parity completion + commit range, and update `MEMORY.md` index.

---

## Notes on DTO field names

Several lib methods above include payload shapes (e.g. `decision`, `paymentMethod`, `visitScheduledAt`, `rwaAdminId`). These are inferred from the web client + controller names. **While implementing each task, open the corresponding `apps/api/src/modules/<module>/dto/*.ts` and match field names exactly** — a mismatch yields a silent 400. This is the one place to verify against source rather than trust the plan.
