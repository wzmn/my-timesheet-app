import { NextResponse } from 'next/server';
import { signToken } from '../../lib/jwt';

/**
 * Simple mock login API for local development.
 * Accepts POST JSON: { email, password }
 * - If email === 'test@example.com' and password === 'password123' -> 200
 * - Otherwise -> 401
 *
 * Replace with your real auth logic or connect to your identity provider.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ message: 'Missing email or password' }, { status: 400 });
    }

    // Mock authentication rule for local/dev
    const isValid = email === 'test@example.com' && password === 'password123';

    if (!isValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Create a signed JWT and set it as an HttpOnly cookie.
    const token = signToken({ sub: email }, { expiresIn: 60 * 60 * 24 * 7 });
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const setCookie = `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`;

    // Return JSON and set HttpOnly cookie so the browser sends it on subsequent requests.
    return NextResponse.json(
      { message: 'Login successful', user: { email } },
      { status: 200, headers: { 'Set-Cookie': setCookie } }
    );
  } catch (err) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
