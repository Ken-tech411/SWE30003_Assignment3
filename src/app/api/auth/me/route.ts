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
      `SELECT 
         u.userId, u.username, u.role, u.linkedId,
         c.name as name, c.customerId
       FROM UserSession s
       JOIN UserAccount u ON s.userId = u.userId
       LEFT JOIN Customer c ON u.role = 'customer' AND u.linkedId = c.customerId
       WHERE s.sessionToken = ? AND s.isActive = 1`,
      [sessionToken]
    ) as any[];
    const user = sessions[0];
    if (!user) return NextResponse.json({ user: null });

    let customerId = null;
    let pharmacistId = null;
    if (user.role === "customer" && user.linkedId) {
      customerId = user.linkedId;
    } else if (user.role === "pharmacist" && user.linkedId) {
      pharmacistId = user.linkedId;
    }

    return NextResponse.json({
      user: {
        ...user,
        customerId,
        pharmacistId,
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}