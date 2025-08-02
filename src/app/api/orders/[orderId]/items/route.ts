import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;
    const items = await query(
      `SELECT oi.productId, p.name, oi.unitPrice, oi.quantity
       FROM OrderItem oi
       JOIN Product p ON oi.productId = p.productId
       WHERE oi.orderId = ?`,
      [orderId]
    );
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
  }
}