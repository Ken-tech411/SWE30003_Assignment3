import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      request.headers.get('authorization') ||
      cookieStore.get('sessionToken')?.value;

    if (!sessionToken) return NextResponse.json({ user: null });

    const [sessions] = await pool.query(
      `SELECT u.userId, u.username, u.role, u.linkedId
       FROM UserSession s
       JOIN UserAccount u ON s.userId = u.userId
       WHERE s.sessionToken = ? AND s.isActive = 1`,
      [sessionToken]
    ) as any[];
    if (!sessions[0]) return NextResponse.json({ user: null });
    return NextResponse.json({ user: sessions[0] });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}