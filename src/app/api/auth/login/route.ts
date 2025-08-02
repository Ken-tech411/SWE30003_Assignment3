import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const [users] = await pool.query(
      `SELECT * FROM UserAccount WHERE username = ?`,
      [username]
    ) as any[];
    const user = users[0];
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // Generate session token
    const sessionToken = randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO UserSession (userId, sessionToken, isActive) VALUES (?, ?, 1)`,
      [user.userId, sessionToken]
    );

    // Set cookie
    const response = NextResponse.json({
      success: true,
      role: user.role,
      userId: user.userId,
      linkedId: user.linkedId,
      sessionToken
    });
    response.cookies.set('sessionToken', sessionToken, { httpOnly: true, path: '/' });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}