import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyToken } from '../../lib/jwt';

function getSessionFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|; )session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Mock in-memory timesheet store for development.
 * NOTE: Serverless functions are stateless between invocations; this store will only live
 * for the lifetime of the running server process and is not persistent.
 */
const store = {
  entries: [
    { id: '1', owner: 'test@example.com', date: new Date().toISOString(), hours: 8, description: 'Initial sample entry' },
  ],
};

export async function GET(request) {
  // Require a valid JWT in the session cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const token = getSessionFromCookieHeader(cookieHeader);
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const payload = verifyToken(token);
    const owner = payload.sub;
    const entries = store.entries.filter((e) => e.owner === owner);
    return NextResponse.json({ entries }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    // Authenticate
    const cookieHeader = request.headers.get('cookie') || '';
    const token = getSessionFromCookieHeader(cookieHeader);
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    let owner;
    try {
      const payload = verifyToken(token);
      owner = payload.sub;
    } catch (err) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { date, hours, description } = body || {};
    if (!date || !hours) {
      return NextResponse.json({ message: 'Missing date or hours' }, { status: 400 });
    }
    const entry = { id: randomUUID(), owner, date, hours: Number(hours), description: description || '' };
    store.entries.unshift(entry);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
