import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const customers = await query('SELECT * FROM Customer ORDER BY name');
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await query(
      `INSERT INTO Customer (name, phoneNumber, email, address, dateOfBirth, gender)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.name, data.phoneNumber, data.email, data.address, data.dateOfBirth, data.gender]
    );
    return NextResponse.json({ customerId: (result as any).insertId });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

// Optionally, add a PUT handler to update customer info
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const customerId = url.pathname.split('/').pop();
    const data = await request.json();
    await query(
      `UPDATE Customer SET name=?, phoneNumber=?, email=?, address=?, dateOfBirth=?, gender=? WHERE customerId=?`,
      [data.name, data.phoneNumber, data.email, data.address, data.dateOfBirth, data.gender, customerId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
