'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { propertiesApi } from '@/lib/api/properties.api';

type PendingProperty = {
  id: string;
  flatNumber: string;
  towerBlock: string;
  society: { id: string; name: string; slug: string };
  createdAt: string;
};

export default function VerificationQueuePage() {
  const [items, setItems] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () =>
    propertiesApi
      .getVerificationQueue()
      .then((r) => setItems(r.data as PendingProperty[]))
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
  }, []);

  const decide = async (id: string, decision: 'RWA_APPROVED' | 'REJECTED') => {
    await propertiesApi.updateVerification(id, decision);
    await refresh();
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Verification Queue</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No pending listings.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex justify-between items-center p-4 border border-border rounded bg-card"
            >
              <div>
                <p className="font-medium text-foreground">
                  {p.flatNumber}, {p.towerBlock}
                </p>
                <p className="text-sm text-muted-foreground">{p.society.name}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/property/${p.id}`}
                  target="_blank"
                  className="px-3 py-1 border border-border text-foreground rounded text-sm hover:bg-muted"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => decide(p.id, 'RWA_APPROVED')}
                  className="px-3 py-1 bg-success text-white rounded text-sm"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(p.id, 'REJECTED')}
                  className="px-3 py-1 bg-error text-white rounded text-sm"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
