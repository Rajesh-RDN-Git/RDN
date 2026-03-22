'use client';

import { useState, useRef } from 'react';
import { usersApi } from '@/lib/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, ShieldIcon } from '@/components/ui/icons';

type TabKey = 'profile' | 'notifications' | 'security';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

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
      <h1 className="mb-6 text-heading-xl text-gray-900">Settings</h1>

      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-label-md font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-display-sm text-primary-600">
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
                <p className="text-heading-md text-gray-900">{user?.name}</p>
                <Badge variant="info" className="mt-1">
                  {user?.role?.replace('_', ' ')}
                </Badge>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 block text-body-sm text-primary-600 hover:text-primary-700"
                >
                  Change photo
                </button>
              </div>
            </div>

            {/* Form fields */}
            <div>
              <label className="mb-1.5 block text-label-sm text-gray-700">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
            </div>

            <div>
              <label className="mb-1.5 block text-label-sm text-gray-700">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-label-sm text-gray-700">Phone</label>
              <Input
                value={user?.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : ''}
                disabled
              />
              <p className="mt-1 text-caption-md text-gray-500">
                Phone number cannot be changed for security reasons
              </p>
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-body-sm text-green-700">
                <CheckIcon size={16} /> Profile updated successfully!
              </div>
            )}

            {saveError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700">
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
              <h2 className="text-heading-md text-gray-900">Notification Preferences</h2>
              <p className="mt-1 text-body-sm text-gray-500">
                Configure how you receive notifications
              </p>
            </div>
            {notificationPrefs.map((pref) => (
              <div
                key={pref.label}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="text-label-md text-gray-900">{pref.label}</p>
                  <p className="mt-0.5 text-body-sm text-gray-500">{pref.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2" />
                </label>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-heading-md text-gray-900">Security</h2>
              <p className="mt-1 text-body-sm text-gray-500">
                Manage your account security settings
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <ShieldIcon size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-label-md text-gray-900">Phone Number Authentication</p>
                  <p className="mt-0.5 text-body-sm text-gray-500">
                    Your account is secured with phone OTP authentication
                  </p>
                  <p className="mt-2 font-mono text-body-md text-gray-700">
                    {user?.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <svg
                    className="h-5 w-5 text-blue-600"
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
                  <p className="text-label-md text-gray-900">Active Sessions</p>
                  <p className="mt-0.5 text-body-sm text-gray-500">
                    You are currently logged in on this device
                  </p>
                  <Badge variant="success" className="mt-2">
                    Current Session
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
