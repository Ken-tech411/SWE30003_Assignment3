import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    await pool.query('UPDATE prescriptions SET status = ? WHERE id = ?', [status, params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 });
  }
}