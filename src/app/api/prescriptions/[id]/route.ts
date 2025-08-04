import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { approved } = await request.json();
    await pool.query(
      'UPDATE Prescription SET approved = ? WHERE prescriptionId = ?',
      [approved, params.id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 });
  }
}