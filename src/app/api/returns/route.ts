import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const orderId = searchParams.get('orderId');
    const statuses = searchParams.getAll('status'); // can be multiple

    let sql = `
      SELECT r.*, o.orderId, c.name as customerName, p.name as productName
      FROM \`Return\` r
      JOIN \`Order\` o ON r.orderId = o.orderId
      JOIN Customer c ON o.customerId = c.customerId
      JOIN Product p ON r.productId = p.productId
    `;

    const where: string[] = [];
    const params: any[] = [];

    if (customerId) {
      where.push('o.customerId = ?');
      params.push(customerId);
    }
    if (orderId) {
      where.push('r.orderId = ?');
      params.push(orderId);
    }
    if (statuses.length) {
      const statusConds = statuses.map(() => 'r.status = ?').join(' OR ');
      where.push(`(${statusConds})`);
      params.push(...statuses);
    }

    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ');
    }

    sql += ' ORDER BY r.submittedDate DESC';

    const returns = await query(sql, params);
    return NextResponse.json({ returns });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, productId, reason, description } = await request.json();

    // Fetch the price from the OrderItem table for this order and product
    const orderItemResult = await query(
      'SELECT unitPrice FROM OrderItem WHERE orderId = ? AND productId = ?',
      [orderId, productId]
    ) as any[];

    const orderItem = Array.isArray(orderItemResult) ? orderItemResult[0] : undefined;
    const refundAmount = orderItem && orderItem.unitPrice ? Number(orderItem.unitPrice) : 0;

    const result = await query(
      `INSERT INTO \`Return\` (orderId, productId, reason, description, status, refundAmount, submittedDate)
       VALUES (?, ?, ?, ?, 'pending', ?, NOW())`,
      [orderId, productId, reason, description, refundAmount]
    );

    return NextResponse.json({ success: true, returnId: (result as any).insertId });
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
    const params: any[] = [status];

    if (status === 'completed') {
      sql += ', processedDate = NOW()';
    }

    sql += ' WHERE returnId = ?';
    params.push(returnId);

    await query(sql, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating return request:', error);
    return NextResponse.json({ error: 'Failed to update return request' }, { status: 500 });
  }
}
