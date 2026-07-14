'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@rdn/shared';
import { useAuthStore } from '@/stores/auth-store';
import { societiesApi } from '@/lib/api/societies.api';
import { showToast } from '@/stores/toast-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { SearchIcon } from '@/components/ui/icons';

type SocietyStatus = 'IN_PROGRESS' | 'ONBOARDED' | 'INACTIVE';
type SocietyVerification = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';

interface SocietyRow {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city: string;
  state?: string;
  pincode?: string;
  totalUnits?: number | null;
  amenities?: string[] | unknown;
  status: SocietyStatus;
  verificationStatus: SocietyVerification;
  rwaAdminId?: string | null;
  rwaAdmin?: { id: string; name: string } | null;
}

interface UserRow {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

const statusVariant = (s: SocietyStatus) => {
  switch (s) {
    case 'ONBOARDED':
      return 'success' as const;
    case 'INACTIVE':
      return 'error' as const;
    default:
      return 'warning' as const;
  }
};

const verificationVariant = (s: SocietyVerification) => {
  switch (s) {
    case 'VERIFIED':
      return 'success' as const;
    case 'REJECTED':
      return 'error' as const;
    case 'FLAGGED':
      return 'warning' as const;
    default:
      return 'info' as const;
  }
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

interface CreateForm {
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalUnits: string;
  amenities: string;
}

const emptyCreateForm: CreateForm = {
  name: '',
  slug: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  totalUnits: '',
  amenities: '',
};

// Edit reuses the create fields minus slug (immutable) and status (managed via Verify).
type EditForm = Omit<CreateForm, 'slug'>;

const emptyEditForm: EditForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  totalUnits: '',
  amenities: '',
};

export default function SocietiesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const [societies, setSocieties] = useState<SocietyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm);
  const [createSlugDirty, setCreateSlugDirty] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<SocietyRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Verify modal
  const [verifyTarget, setVerifyTarget] = useState<SocietyRow | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<'VERIFIED' | 'FLAGGED' | 'REJECTED'>(
    'VERIFIED',
  );
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Assign RWA modal
  const [assignTarget, setAssignTarget] = useState<SocietyRow | null>(null);
  const [assignRoleFilter, setAssignRoleFilter] = useState<string>(Role.RWA_ADMIN);
  const [assignCandidates, setAssignCandidates] = useState<UserRow[]>([]);
  const [assignCandidatesLoading, setAssignCandidatesLoading] = useState(false);
  const [assignSelectedId, setAssignSelectedId] = useState<string>('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const limit = 20;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const filteredSocieties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return societies;
    return societies.filter((s) =>
      [s.name, s.city, s.state, s.slug, s.rwaAdmin?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [societies, search]);

  const fetchSocieties = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await societiesApi.list({ page, limit });
      setSocieties((data.data as SocietyRow[]) || []);
      setTotal(Number(data.total) || 0);
    } catch (err: any) {
      setSocieties([]);
      setLoadError(
        err?.code === 'ERR_NETWORK'
          ? 'Network error. Please check your connection.'
          : err?.response?.data?.message || 'Failed to load societies.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchSocieties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isSuperAdmin]);

  // ----- Create -----
  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateSlugDirty(false);
    setCreateError(null);
    setCreateOpen(true);
  };

  const onCreateNameChange = (value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      name: value,
      slug: createSlugDirty ? prev.slug : slugify(value),
    }));
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const totalUnitsNum = createForm.totalUnits ? Number(createForm.totalUnits) : undefined;
    if (createForm.totalUnits && (!Number.isFinite(totalUnitsNum) || (totalUnitsNum ?? 0) <= 0)) {
      setCreateError('Total units must be a positive number.');
      return;
    }

    const amenities = createForm.amenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setCreateSubmitting(true);
    try {
      await societiesApi.create({
        name: createForm.name,
        slug: createForm.slug,
        address: createForm.address,
        city: createForm.city,
        state: createForm.state,
        pincode: createForm.pincode,
        ...(totalUnitsNum !== undefined ? { totalUnits: totalUnitsNum } : {}),
        ...(amenities.length ? { amenities } : {}),
      });
      showToast.success('Society created.');
      setCreateOpen(false);
      // Reset to first page so the new one is visible
      if (page !== 1) setPage(1);
      else fetchSocieties();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setCreateError(
        Array.isArray(msg)
          ? msg.join(', ')
          : typeof msg === 'string'
            ? msg
            : 'Failed to create society.',
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ----- Edit -----
  const openEdit = (row: SocietyRow) => {
    setEditTarget(row);
    setEditError(null);
    setEditForm({
      name: row.name,
      address: row.address || '',
      city: row.city,
      state: row.state || '',
      pincode: row.pincode || '',
      totalUnits: row.totalUnits != null ? String(row.totalUnits) : '',
      amenities: Array.isArray(row.amenities) ? (row.amenities as string[]).join(', ') : '',
    });
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);

    const totalUnitsNum = editForm.totalUnits ? Number(editForm.totalUnits) : undefined;
    if (editForm.totalUnits && (!Number.isFinite(totalUnitsNum) || (totalUnitsNum ?? 0) <= 0)) {
      setEditError('Total units must be a positive number.');
      return;
    }

    const amenities = editForm.amenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setEditSubmitting(true);
    try {
      await societiesApi.update(editTarget.id, {
        name: editForm.name,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        pincode: editForm.pincode,
        amenities,
        // totalUnits must be a positive int when present; omit to leave unchanged.
        ...(totalUnitsNum !== undefined ? { totalUnits: totalUnitsNum } : {}),
      });
      showToast.success('Society updated.');
      setEditTarget(null);
      fetchSocieties();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setEditError(
        Array.isArray(msg)
          ? msg.join(', ')
          : typeof msg === 'string'
            ? msg
            : 'Failed to update society.',
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  // ----- Verify -----
  const openVerify = (row: SocietyRow) => {
    setVerifyTarget(row);
    setVerifyDecision('VERIFIED');
    setVerifyNotes('');
    setVerifyError(null);
  };

  const onVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTarget) return;
    setVerifyError(null);
    setVerifySubmitting(true);
    try {
      await societiesApi.verify(verifyTarget.id, {
        status: verifyDecision,
        ...(verifyNotes.trim() ? { notes: verifyNotes.trim() } : {}),
      });
      showToast.success(`Society ${verifyDecision.toLowerCase()}.`);
      setVerifyTarget(null);
      fetchSocieties();
    } catch (err: any) {
      setVerifyError(err?.response?.data?.message || 'Failed to update verification status.');
    } finally {
      setVerifySubmitting(false);
    }
  };

  // ----- Assign RWA -----
  const fetchCandidates = async (roleFilter: string) => {
    setAssignCandidatesLoading(true);
    try {
      const { data } = await societiesApi.getRwaCandidates({
        role: roleFilter || undefined,
        limit: 50,
      });
      setAssignCandidates((data.data as UserRow[]) || []);
    } catch {
      // Non-fatal — surface via empty list and inline note
      setAssignCandidates([]);
    } finally {
      setAssignCandidatesLoading(false);
    }
  };

  const openAssign = (row: SocietyRow) => {
    setAssignTarget(row);
    setAssignError(null);
    setAssignSelectedId(row.rwaAdminId || '');
    setAssignRoleFilter(Role.RWA_ADMIN);
    fetchCandidates(Role.RWA_ADMIN);
  };

  const onAssignRoleFilterChange = (value: string) => {
    setAssignRoleFilter(value);
    setAssignSelectedId('');
    fetchCandidates(value);
  };

  const onAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    if (!assignSelectedId) {
      setAssignError('Please select a user.');
      return;
    }
    setAssignError(null);
    setAssignSubmitting(true);
    try {
      await societiesApi.assignRwaAdmin(assignTarget.id, assignSelectedId);
      showToast.success('RWA admin assigned.');
      setAssignTarget(null);
      fetchSocieties();
    } catch (err: any) {
      setAssignError(err?.response?.data?.message || 'Failed to assign RWA admin.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const onAssignClear = async () => {
    if (!assignTarget) return;
    setAssignError(null);
    setAssignSubmitting(true);
    try {
      await societiesApi.assignRwaAdmin(assignTarget.id, null);
      showToast.success('RWA admin cleared.');
      setAssignTarget(null);
      fetchSocieties();
    } catch (err: any) {
      setAssignError(err?.response?.data?.message || 'Failed to clear RWA admin.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // ----- Access guard -----
  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Societies</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  // ----- Columns -----
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row: SocietyRow) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      render: (row: SocietyRow) => (
        <span>
          {row.city}
          {row.state ? `, ${row.state}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: SocietyRow) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      render: (row: SocietyRow) => (
        <Badge variant={verificationVariant(row.verificationStatus)}>
          {row.verificationStatus}
        </Badge>
      ),
    },
    {
      key: 'rwaAdmin',
      header: 'RWA Admin',
      render: (row: SocietyRow) =>
        row.rwaAdmin?.name ? (
          <span className="text-sm text-foreground">{row.rwaAdmin.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: SocietyRow) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/dashboard/societies/${row.slug}`)}
          >
            View
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
          {row.verificationStatus === 'PENDING' || row.verificationStatus === 'FLAGGED' ? (
            <Button size="sm" onClick={() => openVerify(row)}>
              Verify
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => openAssign(row)}>
            {row.rwaAdminId ? 'Reassign RWA' : 'Assign RWA'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Societies</h1>
        <Button onClick={openCreate}>Create Society</Button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
          {loadError}
        </div>
      )}

      <div className="relative mb-4 max-w-md">
        <SearchIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search by name, city, or RWA admin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-body-md outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-ring"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredSocieties}
        isLoading={loading}
        keyExtractor={(row: SocietyRow) => row.id}
        emptyMessage="No societies found"
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-4"
      />

      {/* ----- Create Modal ----- */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Society">
        <form onSubmit={onCreateSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={createForm.name}
            onChange={(e) => onCreateNameChange(e.target.value)}
            placeholder="Sunrise Apartments"
            required
            minLength={2}
            maxLength={255}
          />
          <Input
            label="Slug"
            name="slug"
            value={createForm.slug}
            onChange={(e) => {
              setCreateSlugDirty(true);
              setCreateForm((prev) => ({ ...prev, slug: e.target.value }));
            }}
            placeholder="sunrise-apartments"
            hint="Lowercase alphanumeric with hyphens. Auto-generated from name."
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          />
          <Textarea
            label="Address"
            name="address"
            value={createForm.address}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Street, locality"
            required
            minLength={5}
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="City"
              name="city"
              value={createForm.city}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, city: e.target.value }))}
              required
              minLength={2}
              maxLength={100}
            />
            <Input
              label="State"
              name="state"
              value={createForm.state}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, state: e.target.value }))}
              required
              minLength={2}
              maxLength={100}
            />
            <Input
              label="Pincode"
              name="pincode"
              value={createForm.pincode}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, pincode: e.target.value }))}
              required
              pattern="^\d{6}$"
              maxLength={6}
              hint="6 digits"
            />
          </div>
          <Input
            label="Total Units"
            name="totalUnits"
            type="number"
            min={1}
            value={createForm.totalUnits}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, totalUnits: e.target.value }))}
            placeholder="e.g. 240"
          />
          <Input
            label="Amenities"
            name="amenities"
            value={createForm.amenities}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, amenities: e.target.value }))}
            placeholder="Pool, Gym, Clubhouse"
            hint="Comma-separated list."
          />
          {createError && (
            <p className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----- Edit Modal ----- */}
      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Edit ${editTarget.name}` : 'Edit Society'}
      >
        <form onSubmit={onEditSubmit} className="space-y-4">
          {editTarget && (
            <p className="text-xs text-muted-foreground">
              Slug <span className="font-mono text-foreground">{editTarget.slug}</span> (not
              editable)
            </p>
          )}
          <Input
            label="Name"
            name="name"
            value={editForm.name}
            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            minLength={2}
            maxLength={255}
          />
          <Textarea
            label="Address"
            name="address"
            value={editForm.address}
            onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
            required
            minLength={5}
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="City"
              name="city"
              value={editForm.city}
              onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
              required
              minLength={2}
              maxLength={100}
            />
            <Input
              label="State"
              name="state"
              value={editForm.state}
              onChange={(e) => setEditForm((prev) => ({ ...prev, state: e.target.value }))}
              required
              minLength={2}
              maxLength={100}
            />
            <Input
              label="Pincode"
              name="pincode"
              value={editForm.pincode}
              onChange={(e) => setEditForm((prev) => ({ ...prev, pincode: e.target.value }))}
              required
              pattern="^\d{6}$"
              maxLength={6}
              hint="6 digits"
            />
          </div>
          <Input
            label="Total Units"
            name="totalUnits"
            type="number"
            min={1}
            value={editForm.totalUnits}
            onChange={(e) => setEditForm((prev) => ({ ...prev, totalUnits: e.target.value }))}
            placeholder="e.g. 240"
          />
          <Input
            label="Amenities"
            name="amenities"
            value={editForm.amenities}
            onChange={(e) => setEditForm((prev) => ({ ...prev, amenities: e.target.value }))}
            placeholder="Pool, Gym, Clubhouse"
            hint="Comma-separated list."
          />
          {editError && (
            <p className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
              {editError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={editSubmitting}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----- Verify Modal ----- */}
      <Modal
        isOpen={verifyTarget !== null}
        onClose={() => setVerifyTarget(null)}
        title={verifyTarget ? `Verify ${verifyTarget.name}` : 'Verify Society'}
      >
        <form onSubmit={onVerifySubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current status:{' '}
            <Badge
              variant={verificationVariant(
                (verifyTarget?.verificationStatus as SocietyVerification) ?? 'PENDING',
              )}
            >
              {verifyTarget?.verificationStatus}
            </Badge>
          </p>
          <Select
            label="Decision"
            value={verifyDecision}
            onChange={(e) => setVerifyDecision(e.target.value as typeof verifyDecision)}
          >
            <option value="VERIFIED">Verify (mark verified, onboard society)</option>
            <option value="FLAGGED">Flag for review</option>
            <option value="REJECTED">Reject</option>
          </Select>
          <Textarea
            label="Notes (optional)"
            name="notes"
            value={verifyNotes}
            onChange={(e) => setVerifyNotes(e.target.value)}
            placeholder="Reason or context for the decision."
            rows={3}
          />
          {verifyError && (
            <p className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
              {verifyError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setVerifyTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={verifyDecision === 'REJECTED' ? 'danger' : 'primary'}
              isLoading={verifySubmitting}
            >
              Submit
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----- Assign RWA Modal ----- */}
      <Modal
        isOpen={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        title={assignTarget ? `Assign RWA Admin — ${assignTarget.name}` : 'Assign RWA Admin'}
      >
        <form onSubmit={onAssignSubmit} className="space-y-4">
          {assignTarget?.rwaAdmin?.name && (
            <p className="text-sm text-muted-foreground">
              Currently assigned:{' '}
              <span className="text-foreground">{assignTarget.rwaAdmin.name}</span>
            </p>
          )}
          <Select
            label="Filter users by role"
            value={assignRoleFilter}
            onChange={(e) => onAssignRoleFilterChange(e.target.value)}
          >
            <option value={Role.RWA_ADMIN}>Existing RWA admins</option>
            <option value="">Any user (will be promoted to RWA admin)</option>
            <option value={Role.OWNER}>Owners</option>
            <option value={Role.BUYER_TENANT}>Buyers/Tenants</option>
          </Select>
          <Select
            label="Select user"
            value={assignSelectedId}
            onChange={(e) => setAssignSelectedId(e.target.value)}
            disabled={assignCandidatesLoading || assignCandidates.length === 0}
          >
            <option value="">
              {assignCandidatesLoading
                ? 'Loading users…'
                : assignCandidates.length === 0
                  ? 'No users found for this role'
                  : 'Choose a user…'}
            </option>
            {assignCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || '(unnamed)'} {c.email ? `· ${c.email}` : ''}
                {c.role && c.role !== Role.RWA_ADMIN ? ` · ${c.role}` : ''}
              </option>
            ))}
          </Select>
          {assignError && (
            <p className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
              {assignError}
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <div>
              {assignTarget?.rwaAdminId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onAssignClear}
                  isLoading={assignSubmitting}
                >
                  Clear assignment
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setAssignTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={assignSubmitting}>
                Assign
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
