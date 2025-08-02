import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;

    // Gather filters
    const statuses = searchParams.getAll('status'); // ?status=Responded&status=Flagged
    const categories = searchParams.getAll('category'); // ?category=Service

    let where: string[] = [];
    let params: any[] = [];

    if (statuses.length) {
      where.push(`status IN (${statuses.map(() => '?').join(',')})`);
      params.push(...statuses);
    }
    if (categories.length) {
      where.push(`category IN (${categories.map(() => '?').join(',')})`);
      params.push(...categories);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Get total count for filtered set
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total FROM Feedback ${whereClause}`,
      params
    ) as any[];
    const total = totalRows[0]?.total || 0;

    // Get paginated filtered data
    const [rows] = await pool.query(
      `SELECT * FROM Feedback ${whereClause} ORDER BY submittedDate DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ) as any[];

    // Get status counts (for all data, not just filtered)
    const [statusCountsRows] = await pool.query(
      `SELECT status, COUNT(*) as count FROM Feedback GROUP BY status`
    ) as any[];
    const statusCounts: Record<string, number> = {};
    statusCountsRows.forEach((row: any) => {
      statusCounts[row.status] = row.count;
    });

    return NextResponse.json({ data: rows, total, statusCounts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Collect only provided fields
    const columns = [];
    const values = [];
    if (body.customerId !== undefined) { columns.push("customerId"); values.push(body.customerId); }
    if (body.orderId !== undefined) { columns.push("orderId"); values.push(body.orderId); }
    if (body.rating !== undefined) { columns.push("rating"); values.push(body.rating); }
    if (body.comments !== undefined) { columns.push("comments"); values.push(body.comments); }
    if (body.category !== undefined) { columns.push("category"); values.push(body.category); }
    if (body.channel !== undefined) { columns.push("channel"); values.push(body.channel); }
    // Add more fields as needed

    // Always add submittedDate and lastUpdated
    columns.push("submittedDate");
    values.push(new Date());
    columns.push("lastUpdated");
    values.push(new Date());

    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO Feedback (${columns.join(", ")}) VALUES (${placeholders})`;

    const [result] = await pool.query(sql, values);
    return NextResponse.json({ success: true, id: (result as any).insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
  }
}