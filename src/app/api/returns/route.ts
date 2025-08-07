import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // pool is your db connection

// Define a type for a return row for type safety
type ReturnRow = {
  returnId: number;
  orderId: number;
  productId: number;
  reason: string;
  description: string;
  status: string;
  refundAmount: number;
  submittedDate: string;
  processedDate?: string;
  customerId: number;
  customerName: string;
  productName: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;

    const statuses = searchParams.getAll('status');
    const orderId = searchParams.get('orderId');
    const customerId = searchParams.get('customerId');

    const where: string[] = [];
    const params: (string | number)[] = [];

    if (statuses.length) {
      const statusConds = statuses.map(() => "r.status = ?");
      where.push(`(${statusConds.join(" OR ")})`);
      params.push(...statuses);
    }
    if (orderId) {
      where.push("r.orderId = ?");
      params.push(orderId);
    }
    if (customerId) {
      where.push("o.customerId = ?");
      params.push(customerId);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Get total count for filtered set (pagination)
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM \`Return\` r
       JOIN \`Order\` o ON r.orderId = o.orderId
       ${whereClause}`,
      params
    ) as unknown as Array<{ total: number }>;
    const total = Array.isArray(totalRows) ? totalRows[0]?.total || 0 : 0;

    // Get paginated filtered data
    const [returns] = await pool.query(
      `SELECT 
        r.*, 
        o.orderId, 
        o.customerId,        
        c.name as customerName, 
        p.name as productName
      FROM \`Return\` r
      JOIN \`Order\` o ON r.orderId = o.orderId
      JOIN Customer c ON o.customerId = c.customerId
      JOIN Product p ON r.productId = p.productId
      ${whereClause}
      ORDER BY r.submittedDate DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ) as unknown as ReturnRow[];

    // --- Get stats for the whole Return table (not paginated/filtered) ---
    const [statsRows] = await pool.query(
      `SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(refundAmount) as totalRefunds
      FROM \`Return\``
    ) as unknown as Array<{ pending: number; approved: number; rejected: number; totalRefunds: number }>;
    const stats = Array.isArray(statsRows) ? statsRows[0] || { pending: 0, approved: 0, rejected: 0, totalRefunds: 0 } : { pending: 0, approved: 0, rejected: 0, totalRefunds: 0 };

    return NextResponse.json({ returns, total, stats });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, productId, reason, description } = await request.json();

    // Fetch the price from the OrderItem table for this order and product
    const [orderItemResult] = await pool.query(
      'SELECT unitPrice FROM OrderItem WHERE orderId = ? AND productId = ?',
      [orderId, productId]
    ) as unknown as Array<{ unitPrice: number }>;
    const orderItem = Array.isArray(orderItemResult) ? orderItemResult[0] : undefined;
    const refundAmount = orderItem && orderItem.unitPrice ? Number(orderItem.unitPrice) : 0;

    const resultArr = await pool.query(
      `INSERT INTO \`Return\` (orderId, productId, reason, description, status, refundAmount, submittedDate)
       VALUES (?, ?, ?, ?, 'pending', ?, NOW())`,
      [orderId, productId, reason, description, refundAmount]
    );
    const result = Array.isArray(resultArr) ? resultArr[0] as { insertId: number } : { insertId: 0 };

    return NextResponse.json({ success: true, returnId: result.insertId });
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { returnId, status } = await request.json();

    if (!returnId || !status) {
      return NextResponse.json({ error: 'Missing returnId or status' }, { status: 400 });
    }

    // Optionally, update processedDate if status is 'completed'
    let sql = 'UPDATE `Return` SET status = ?';
    const params: (string | number)[] = [status];

    if (status === 'completed') {
      sql += ', processedDate = NOW()';
    }

    sql += ' WHERE returnId = ?';
    params.push(returnId);

    await pool.query(sql, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating return request:', error);
    return NextResponse.json({ error: 'Failed to update return request' }, { status: 500 });
  }
}