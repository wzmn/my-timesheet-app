'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Entry = {
  id: string;
  date: string; // ISO date
  hours: number;
  description?: string;
};

export default function TimesheetDashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // form state
  const [date, setDate] = useState('');
  const [hours, setHours] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/timesheet');
      if (!res.ok) throw new Error('Failed to load entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError((err instanceof Error) ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (err) {
      // ignore errors — proceed to redirect
    }
    // force client-side navigation to login which will show the login page
    router.push('/login');
  }

  function totalHours() {
    return entries.reduce((s, e) => s + (e.hours || 0), 0);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!date) return setError('Please select a date');
    const parsedHours = Number(hours);
    if (!parsedHours || parsedHours <= 0) return setError('Enter hours > 0');

    const payload = { date, hours: parsedHours, description };
    setSubmitting(true);
    try {
      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error((p && p.message) || 'Failed to add entry');
      }
      const created = await res.json();
      // Prepend created entry
      setEntries(prev => [created.entry, ...prev]);
      // reset form
      setDate('');
      setHours('');
      setDescription('');
    } catch (err) {
      setError((err instanceof Error) ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Timesheet Dashboard</h1>
        <div>
          <button onClick={handleLogout} style={{ padding: '8px 12px' }}>Logout</button>
        </div>
      </div>
      <section style={{ marginBottom: 18 }}>
        <strong>Total hours:</strong> {totalHours()} hrs
      </section>

      <section style={{ marginBottom: 18, padding: 12, border: '1px solid #e6e6e6', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Add entry</h2>
        {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            Hours
            <input type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            Description
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div>
            <button type="submit" disabled={submitting} style={{ padding: '8px 12px' }}>
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 style={{ marginTop: 0 }}>Entries</h2>
        {loading ? (
          <div>Loading…</div>
        ) : entries.length === 0 ? (
          <div>No entries yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px' }}>Date</th>
                <th style={{ padding: '8px' }}>Hours</th>
                <th style={{ padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((en) => (
                <tr key={en.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{new Date(en.date).toLocaleDateString()}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{en.hours}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>{en.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
