import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password, role, linkedId } = await request.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO UserAccount (username, passwordHash, role, linkedId) VALUES (?, ?, ?, ?)`,
      [username, passwordHash, role, linkedId || null]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}