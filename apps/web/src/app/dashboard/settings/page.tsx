'use client';

import { useState } from 'react';
import { usersApi } from '@/lib/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type TabKey = 'profile' | 'notifications' | 'security';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const { data } = await usersApi.updateProfile({ name, email });
      setUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      /\* ignore \*/;
    }
    setSaving(false);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'security', label: 'Security' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>

      <div className="mb-6 flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl rounded-lg border bg-white p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-lg font-semibold">{user?.name}</p>
                <Badge variant="info">{user?.role?.replace('_', ' ')}</Badge>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <Input
                value={user?.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : ''}
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Phone number cannot be changed for security reasons
              </p>
            </div>

            {success && <p className="text-sm text-green-600">Profile updated successfully!</p>}

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-500">Configure how you receive notifications.</p>
            {[
              'Lead Updates',
              'Deal Notifications',
              'Commission Alerts',
              'Visit Reminders',
              'System Announcements',
            ].map((pref) => (
              <div key={pref} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-gray-900">{pref}</p>
                  <p className="text-sm text-gray-500">
                    Receive {pref.toLowerCase()} via in-app and push
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Security</h2>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-gray-900">Phone Number</p>
              <p className="text-sm text-gray-500">
                Your account is secured with phone OTP authentication.
              </p>
              <p className="mt-2 font-mono text-sm">
                {user?.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-500">You are currently logged in on this device.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
