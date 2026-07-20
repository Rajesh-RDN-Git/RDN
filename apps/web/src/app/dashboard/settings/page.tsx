'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users.api';
import { clearTokens } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';
import { showToast } from '@/stores/toast-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, ShieldIcon } from '@/components/ui/icons';
import { FileGrievanceModal } from '@/components/grievance/file-grievance-modal';

type TabKey = 'profile' | 'notifications' | 'security';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim() !== 'DELETE') return;
    setDeleting(true);
    try {
      await usersApi.deleteAccount();
      clearTokens();
      logout();
      showToast.success('Your account has been deleted');
      router.push('/');
    } catch {
      showToast.error('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [grievanceOpen, setGrievanceOpen] = useState(false);

  const validate = () => {
    let valid = true;
    setNameError('');
    setEmailError('');
    if (!name.trim()) {
      setNameError('Name is required');
      valid = false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    }
    return valid;
  };

  const handleSaveProfile = async () => {
    if (!validate()) return;
    setSaving(true);
    setSuccess(false);
    setSaveError(null);
    try {
      const { data } = await usersApi.updateProfile({ name, email });
      setUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save profile. Please try again.');
    }
    setSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'security', label: 'Security' },
  ];

  const notificationPrefs = [
    { label: 'Lead Updates', description: 'Get notified when leads are assigned or updated' },
    { label: 'Deal Notifications', description: 'Alerts when deals are closed or updated' },
    { label: 'Commission Alerts', description: 'Commission payout notifications' },
    { label: 'Visit Reminders', description: 'Reminders for scheduled property visits' },
    { label: 'System Announcements', description: 'Platform updates and announcements' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-heading-xl text-foreground">Settings</h1>

      <div className="mb-6 flex gap-1 rounded-lg bg-subtle p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-label-md font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex max-w-2xl items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning-bg">
            <ShieldIcon size={20} className="text-warning-text" />
          </div>
          <div>
            <p className="text-label-md text-foreground">Need help or want to report an issue?</p>
            <p className="mt-0.5 text-body-sm text-muted-foreground">
              File a grievance and our team will follow up.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setGrievanceOpen(true)}>
          File a Grievance
        </Button>
      </div>

      <FileGrievanceModal open={grievanceOpen} onClose={() => setGrievanceOpen(false)} />

      <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                {avatarPreview || user?.avatarUrl ? (
                  <img
                    src={avatarPreview || user?.avatarUrl || undefined}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-subtle text-display-sm text-brand">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-heading-md text-foreground">{user?.name}</p>
                <Badge variant="info" className="mt-1">
                  {user?.role?.replace('_', ' ')}
                </Badge>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 block text-body-sm text-brand hover:text-brand-text"
                >
                  Change photo
                </button>
              </div>
            </div>

            {/* Form fields */}
            <div>
              <label className="mb-1.5 block text-label-sm text-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
            </div>

            <div>
              <label className="mb-1.5 block text-label-sm text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-label-sm text-foreground">Phone</label>
              <Input
                value={user?.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : ''}
                disabled
              />
              <p className="mt-1 text-caption-md text-muted-foreground">
                Phone number cannot be changed for security reasons
              </p>
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-success-bg px-4 py-3 text-body-sm text-success-text">
                <CheckIcon size={16} /> Profile updated successfully!
              </div>
            )}

            {saveError && (
              <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-body-sm text-error-text">
                {saveError}
              </div>
            )}

            <Button onClick={handleSaveProfile} isLoading={saving}>
              Save Changes
            </Button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-heading-md text-foreground">Notification Preferences</h2>
              <p className="mt-1 text-body-sm text-muted-foreground">
                Configure how you receive notifications
              </p>
            </div>
            {notificationPrefs.map((pref) => (
              <div
                key={pref.label}
                className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted"
              >
                <div>
                  <p className="text-label-md text-foreground">{pref.label}</p>
                  <p className="mt-0.5 text-body-sm text-muted-foreground">{pref.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-subtle transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-card after:shadow-sm after:transition-all peer-checked:bg-brand peer-checked:after:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
                </label>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-heading-md text-foreground">Security</h2>
              <p className="mt-1 text-body-sm text-muted-foreground">
                Manage your account security settings
              </p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg">
                  <ShieldIcon size={20} className="text-success-icon" />
                </div>
                <div>
                  <p className="text-label-md text-foreground">Phone Number Authentication</p>
                  <p className="mt-0.5 text-body-sm text-muted-foreground">
                    Your account is secured with phone OTP authentication
                  </p>
                  <p className="mt-2 font-mono text-body-md text-foreground">
                    {user?.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-bg">
                  <svg
                    className="h-5 w-5 text-info-text"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-label-md text-foreground">Active Sessions</p>
                  <p className="mt-0.5 text-body-sm text-muted-foreground">
                    You are currently logged in on this device
                  </p>
                  <Badge variant="success" className="mt-2">
                    Current Session
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-error-border bg-error-bg/30 p-5">
              <p className="text-label-md text-error-text">Delete account</p>
              <p className="mt-0.5 text-body-sm text-muted-foreground">
                Permanently deletes your account and removes your personal data. This cannot be
                undone. To confirm, type <span className="font-semibold">DELETE</span> below.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="max-w-[160px]"
                />
                <Button
                  variant="danger"
                  isLoading={deleting}
                  disabled={deleteConfirm.trim() !== 'DELETE'}
                  onClick={handleDeleteAccount}
                >
                  Delete my account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
