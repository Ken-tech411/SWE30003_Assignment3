import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    // Get order items
    const items = await query(
      `SELECT oi.productId, p.name, oi.unitPrice, oi.quantity
       FROM OrderItem oi
       JOIN Product p ON oi.productId = p.productId
       WHERE oi.orderId = ?`,
      [orderId]
    );

    // Get customerId from the order
    const orderResult = await query(
      `SELECT customerId FROM \`Order\` WHERE orderId = ?`,
      [orderId]
    ) as unknown[];
    const orderData = orderResult[0] as Record<string, unknown>;
    const customerId = orderData?.customerId;

    // Get prescriptionId(s) for this customer
    let prescriptionId: number | null = null;
    if (customerId) {
      const prescriptionResult = await query(
        `SELECT prescriptionId FROM Prescription WHERE pharmacistId = ? ORDER BY uploadDate DESC LIMIT 1`,
        [customerId]
      ) as unknown[];
      const prescriptionData = prescriptionResult[0] as Record<string, unknown>;
      prescriptionId = prescriptionData?.prescriptionId ? Number(prescriptionData.prescriptionId) : null;
    }

    return NextResponse.json({ items, prescriptionId });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order items or prescription' }, { status: 500 });
  }
}
