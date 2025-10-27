import React from 'react';
import TimesheetDashboard from './TimesheetDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '../lib/jwt';

export default async function Page() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  // If no session cookie is present, redirect to /login
  if (!session) {
    redirect('/login');
  }

  // Validate token server-side. If invalid, redirect to login
  try {
    const token = session.value;
    verifyToken(token);
  } catch (err) {
    redirect('/login');
  }

  return <TimesheetDashboard />;
}
