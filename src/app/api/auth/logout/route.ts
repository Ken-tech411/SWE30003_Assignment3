import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies(); // <-- add await here
    const sessionToken =
      request.headers.get('authorization') ||
      cookieStore.get('sessionToken')?.value;

    if (!sessionToken) return NextResponse.json({ error: 'No session' }, { status: 401 });

    await pool.query(
      `UPDATE UserSession SET isActive = 0, logoutTime = NOW() WHERE sessionToken = ? AND isActive = 1`,
      [sessionToken]
    );
    const response = NextResponse.json({ success: true });
    response.cookies.set('sessionToken', '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}