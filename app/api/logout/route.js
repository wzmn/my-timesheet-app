import { NextResponse } from 'next/server';

export async function POST() {
  // Clear the session cookie by setting Max-Age=0
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const setCookie = `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;

  return NextResponse.json({ message: 'Logged out' }, { status: 200, headers: { 'Set-Cookie': setCookie } });
}
