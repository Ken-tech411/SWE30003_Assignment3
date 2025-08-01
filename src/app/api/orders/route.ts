import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const orders = await query(`
      SELECT o.*, c.name as customerName, c.email as customerEmail
      FROM \`Order\` o
      JOIN Customer c ON o.customerId = c.customerId
      ORDER BY o.orderDate DESC
    `);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
