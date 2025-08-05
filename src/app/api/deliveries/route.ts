import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch deliveries (orders)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;

    const statuses = searchParams.getAll('status');
    const orderId = searchParams.get('orderId');
    const customerId = searchParams.get('customerId');

    const where: string[] = [];
    const params: unknown[] = [];

    if (statuses.length) {
      const statusConds = statuses.map(() => "o.status = ?");
      where.push(`(${statusConds.join(" OR ")})`);
      params.push(...statuses);
    }
    if (orderId) {
      where.push("o.orderId = ?");
      params.push(orderId);
    }
    if (customerId) {
      where.push("o.customerId = ?");
      params.push(customerId);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Get total count for filtered set
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId = c.customerId
       ${whereClause}`,
      params
    ) as unknown[];
    const totalRowsArray = totalRows as { total: number }[];
    const total = totalRowsArray[0]?.total || 0;

    // Get paginated filtered data
    const [orders] = await pool.query(
      `SELECT 
        o.orderId,
        o.orderDate,
        o.status,
        o.totalAmount,
        o.customerId,
        o.prescriptionId,
        c.name as customerName,
        c.address as customerAddress
      FROM \`Order\` o
      LEFT JOIN Customer c ON o.customerId = c.customerId
      ${whereClause}
      ORDER BY o.orderDate DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ) as unknown[];

    // Get status counts (for all data, not just filtered)
    const [statusCountsRows] = await pool.query(
      `SELECT 
        SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN o.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as delivered
      FROM \`Order\` o`
    ) as unknown[];
    const statusCountsArray = statusCountsRows as { pending: number; approved: number; delivered: number }[];
    const statusCounts = statusCountsArray[0] || { pending: 0, approved: 0, delivered: 0 };

    return NextResponse.json({ orders, total, statusCounts });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST: Create a new order (delivery)
export async function POST(request: NextRequest) {
  try {
    const { customerId, status, totalAmount, prescriptionId } = await request.json();

    const [result] = await pool.query(
      `INSERT INTO \`Order\` (customerId, status, totalAmount, prescriptionId, orderDate)
       VALUES (?, ?, ?, ?, NOW())`,
      [customerId, status, totalAmount, prescriptionId]
    ) as unknown[];
    const insertResult = result as { insertId: number };

    return NextResponse.json({ success: true, orderId: insertResult.insertId });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// PUT: Update order (delivery) status
export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const sql = 'UPDATE `Order` SET status = ? WHERE orderId = ?';
    const params: unknown[] = [status, orderId];

    await pool.query(sql, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
