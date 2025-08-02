import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Fetch payment(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');

    if (paymentId) {
      const payments = await query(
        `SELECT p.*, o.totalAmount as amount
         FROM Payment p
         LEFT JOIN \`Order\` o ON p.orderId = o.orderId
         WHERE p.paymentId = ?`,
        [paymentId]
      );
      return NextResponse.json({ payment: Array.isArray(payments) && payments.length > 0 ? payments[0] : null });
    }

    if (orderId) {
      const payments = await query(
        `SELECT p.*, o.totalAmount as amount
         FROM Payment p
         LEFT JOIN \`Order\` o ON p.orderId = o.orderId
         WHERE p.orderId = ?
         ORDER BY p.paymentId DESC LIMIT 1`,
        [orderId]
      );
      return NextResponse.json({ payment: Array.isArray(payments) && payments.length > 0 ? payments[0] : null });
    }

    const payments = await query(
      `SELECT p.*, o.totalAmount as amount
       FROM Payment p
       LEFT JOIN \`Order\` o ON p.orderId = o.orderId
       ORDER BY p.transactionDate DESC`
    );
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST: Create a new payment
export async function POST(request: NextRequest) {
  try {
    const { orderId, method, status } = await request.json();

    if (!orderId || !method || !status) {
      return NextResponse.json({ error: 'Missing required fields: orderId, method, or status' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO Payment (orderId, method, transactionDate, status)
       VALUES (?, ?, NOW(), ?)`,
      [orderId, method, status]
    );

    // Fetch amount and method for response
    const [rows]: any = await query(
      `SELECT p.*, o.totalAmount as amount
       FROM Payment p
       LEFT JOIN \`Order\` o ON p.orderId = o.orderId
       WHERE p.paymentId = ?`,
      [(result as any).insertId]
    );
    const payment = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    return NextResponse.json({
      success: true,
      paymentId: (result as any).insertId,
      amount: payment?.amount,
      method: payment?.method
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// PUT: Update payment status
export async function PUT(request: NextRequest) {
  try {
    const { paymentId, status } = await request.json();

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing paymentId or status' }, { status: 400 });
    }

    await query('UPDATE Payment SET status = ? WHERE paymentId = ?', [status, paymentId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}