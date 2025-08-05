import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { RowDataPacket } from 'mysql2';

interface UserAccount extends RowDataPacket {
  userId: number;
  username: string;
  passwordHash: string;
  role: string;
  linkedId?: number;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const [users] = await pool.query<UserAccount[]>(
      `SELECT * FROM UserAccount WHERE username = ?`,
      [username]
    );
    const user = users[0];
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const sessionToken = randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO UserSession (userId, sessionToken, isActive) VALUES (?, ?, 1)`,
      [user.userId, sessionToken]
    );

    const response = NextResponse.json({
      success: true,
      role: user.role,
      userId: user.userId,
      username: user.username,
      linkedId: user.linkedId,
      sessionToken
    });

    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
