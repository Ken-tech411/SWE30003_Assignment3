import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;

  try {
    const body = await request.json();
    const fields = [];
    const values = [];
    // Add all fields you want to update
    if (body.status !== undefined) { fields.push("status = ?"); values.push(body.status); }
    if (body.response !== undefined) { fields.push("response = ?"); values.push(body.response); }
    if (body.isFlagged !== undefined) { fields.push("isFlagged = ?"); values.push(body.isFlagged); }
    if (body.resolutionStatus !== undefined) { fields.push("resolutionStatus = ?"); values.push(body.resolutionStatus); }
    // ...add more as needed
    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(params.id);
    await pool.query(
      `UPDATE Feedback SET ${fields.join(", ")}, lastUpdated = NOW() WHERE feedbackId = ?`,
      values
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
