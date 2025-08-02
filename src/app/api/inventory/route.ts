import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const inventory = await query(`
      SELECT i.*, p.name as productName, b.location as branchLocation
      FROM Inventory i
      JOIN Product p ON i.productId = p.productId
      JOIN Branch b ON i.branchId = b.branchId
      ORDER BY b.location, p.name
    `);
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}
