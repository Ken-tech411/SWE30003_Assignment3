import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [customerCount, orderCount, productCount, branchCount] = await Promise.all([
      query('SELECT COUNT(*) as count FROM Customer'),
      query('SELECT COUNT(*) as count FROM `Order`'),
      query('SELECT COUNT(*) as count FROM Product'),
      query('SELECT COUNT(*) as count FROM Branch')
    ]);

    const stats = {
      customers: Array.isArray(customerCount) ? (customerCount[0] as { count: number })?.count || 0 : 0,
      orders: Array.isArray(orderCount) ? (orderCount[0] as { count: number })?.count || 0 : 0,
      products: Array.isArray(productCount) ? (productCount[0] as { count: number })?.count || 0 : 0,
      branches: Array.isArray(branchCount) ? (branchCount[0] as { count: number })?.count || 0 : 0
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
