'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type CellContext,
} from '@tanstack/react-table';

type Entry = {
  id: string;
  owner?: string;
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
      const res = await fetch('/api/timesheet', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError((err instanceof Error) ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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
        credentials: 'same-origin',
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

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (err) {
      // ignore errors — proceed to redirect
    }
    // force client-side navigation to login which will show the login page
    router.push('/login');
  }

  const columns = useMemo<ColumnDef<Entry, any>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: (info: CellContext<Entry, any>) => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: 'hours',
      header: 'Hours',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
  ], []);

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  } as any);

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
        ) : table.getRowModel().rows.length === 0 ? (
          <div>No entries yet.</div>
        ) : (
          <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => (
                    <th key={header.id} style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row: any) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {row.getVisibleCells().map((cell: any) => (
                    <td key={cell.id} style={{ padding: '8px', verticalAlign: 'top' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>{'<<'}</button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
            <button onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))} disabled={!table.getCanNextPage()}>Last</button>

            <span style={{ marginLeft: 12 }}>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>

            <label style={{ marginLeft: 12 }}>
              | Go to page:
              <input
                type="number"
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={e => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                style={{ width: 60, marginLeft: 8 }}
              />
            </label>

            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              style={{ marginLeft: 12 }}
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
