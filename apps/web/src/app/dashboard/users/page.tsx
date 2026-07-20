'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Role, ROLE_LABELS } from '@rdn/shared';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi, type AdminUser } from '@/lib/api/users.api';
import { showToast } from '@/stores/toast-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';

const PAGE_SIZE = 20;

// Roles the editor can set directly (a clean one-field update). DEALER and RWA_ADMIN
// need linked society records and are handled by their own onboarding flows.
const STANDALONE_ROLES = [Role.SUPER_ADMIN, Role.OWNER, Role.BUYER_TENANT] as const;

const GO_DEALER = '__dealer__';
const GO_RWA = '__rwa__';

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'brand' as const;
    case Role.RWA_ADMIN:
      return 'info' as const;
    case Role.DEALER:
      return 'success' as const;
    case Role.OWNER:
      return 'warning' as const;
    default:
      return 'default' as const;
  }
};

const roleLabel = (role: string) => ROLE_LABELS[role as Role] ?? role;

export default function ManageUsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [pending, setPending] = useState<{ user: AdminUser; role: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    setLoading(true);
    setError(false);
    usersApi
      .adminListUsers({
        page,
        limit: PAGE_SIZE,
        role: roleFilter || undefined,
        search: search || undefined,
      })
      .then((res) => {
        if (!active) return;
        setUsers(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isSuperAdmin, page, roleFilter, search, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const onSelectRole = (row: AdminUser, value: string) => {
    if (value === GO_DEALER) {
      router.push('/dashboard/dealers');
      return;
    }
    if (value === GO_RWA) {
      router.push('/dashboard/societies');
      return;
    }
    if (value === row.role) return;
    setPending({ user: row, role: value });
  };

  const confirmChange = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await usersApi.updateRole(pending.user.id, pending.role);
      showToast.success(`${pending.user.name} is now ${roleLabel(pending.role)}`);
      setPending(null);
      refetch();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not change the role';
      showToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        You do not have permission to view this page.
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (u: AdminUser) => (
        <div>
          <p className="font-medium text-foreground">{u.name}</p>
          {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: AdminUser) => (
        <Badge variant={roleBadgeVariant(u.role)}>{roleLabel(u.role)}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: AdminUser) => (
        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
          {u.status}
        </Badge>
      ),
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (u: AdminUser) =>
        u._count ? (
          <span className="text-xs text-muted-foreground">
            {u._count.ownedProperties} props · {u._count.buyerLeads} leads
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (u: AdminUser) => (
        <span className="text-xs text-muted-foreground">
          {new Date(u.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'change',
      header: 'Change role',
      render: (u: AdminUser) =>
        u.id === user.id ? (
          <span className="text-xs text-muted-foreground">You</span>
        ) : (
          <Select
            aria-label={`Change role for ${u.name}`}
            value={u.role}
            onChange={(e) => onSelectRole(u, e.target.value)}
            className="min-w-[150px]"
          >
            {STANDALONE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
            {/* Current role may be DEALER/RWA — show it so the select isn't blank */}
            {!STANDALONE_ROLES.includes(u.role as (typeof STANDALONE_ROLES)[number]) && (
              <option value={u.role} disabled>
                {roleLabel(u.role)} (current)
              </option>
            )}
            <option value={GO_DEALER}>Make Dealer…</option>
            <option value={GO_RWA}>Make RWA Admin…</option>
          </Select>
        ),
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-xl text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <form onSubmit={onSearch} className="flex flex-1 gap-2">
          <Input
            placeholder="Search name, email, or phone"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className="sm:w-56"
        >
          <option value="">All roles</option>
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="mb-3 text-muted-foreground">Could not load users.</p>
          <Button variant="outline" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          isLoading={loading}
          keyExtractor={(u) => u.id}
          emptyMessage="No users found"
        />
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <Modal isOpen={!!pending} onClose={() => setPending(null)} title="Change role">
        {pending && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Change <span className="font-medium">{pending.user.name}</span> from{' '}
              <span className="font-medium">{roleLabel(pending.user.role)}</span> to{' '}
              <span className="font-medium">{roleLabel(pending.role)}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPending(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={confirmChange} isLoading={saving}>
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
