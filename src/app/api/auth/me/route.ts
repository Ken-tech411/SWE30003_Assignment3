import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import type { RowDataPacket, FieldPacket } from 'mysql2';

interface MeUser extends RowDataPacket {
  userId: number;
  username: string;
  role: string;
  linkedId?: number;
  name?: string;
  customerId?: number;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      request.headers.get('authorization') ||
      (typeof cookieStore.get === 'function' ? cookieStore.get('sessionToken')?.value : undefined);

    if (!sessionToken) return NextResponse.json({ user: null });

    const [sessions]: [MeUser[], FieldPacket[]] = await pool.query(
      `SELECT 
         u.userId, u.username, u.role, u.linkedId,
         c.name as name, c.customerId
       FROM UserSession s
       JOIN UserAccount u ON s.userId = u.userId
       LEFT JOIN Customer c ON u.role = 'customer' AND u.linkedId = c.customerId
       WHERE s.sessionToken = ? AND s.isActive = 1`,
      [sessionToken]
    ) as [MeUser[], FieldPacket[]];
    const user = sessions[0];
    if (!user) return NextResponse.json({ user: null });

    let customerId: number | null = null;
    let pharmacistId: number | null = null;
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
  } catch {
    return NextResponse.json({ user: null });
  }
}