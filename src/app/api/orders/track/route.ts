import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost')
    const orderId = searchParams.get('orderId')
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // Fetch the order with customer info
    const [order] = await query(`
      SELECT o.*, c.name as customerName, c.email as customerEmail, c.address as customerAddress
      FROM \`Order\` o
      JOIN Customer c ON o.customerId = c.customerId
      WHERE o.orderId = ?
    `, [orderId]) as any[]

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order items for this order (optional)
    const items = await query(`
      SELECT oi.orderItemId, oi.productId, oi.quantity, oi.unitPrice as price, 
             p.name as productName, p.description as productDescription
      FROM OrderItem oi
      JOIN Product p ON oi.productId = p.productId
      WHERE oi.orderId = ?
    `, [orderId]) as any[]

    order.items = items

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching tracked order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}