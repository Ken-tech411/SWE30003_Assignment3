import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { approved } = await request.json();
    await pool.query(
      'UPDATE Prescription SET approved = ? WHERE prescriptionId = ?',
      [approved, id]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 });
  }
}
