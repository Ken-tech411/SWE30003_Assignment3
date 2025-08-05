import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost')
    const orderId = searchParams.get('orderId')
    const customerId = searchParams.get('customerId')
    if (!orderId || !customerId) {
      return NextResponse.json({ error: 'Missing orderId or customerId' }, { status: 400 })
    }

    // Fetch the order only if it belongs to this customer
    const orderResult = await query(`
      SELECT o.*, c.name as customerName, c.email as customerEmail, c.address as customerAddress
      FROM \`Order\` o
      JOIN Customer c ON o.customerId = c.customerId
      WHERE o.orderId = ? AND o.customerId = ?
    `, [orderId, customerId]) as unknown[]
    const orderArray = orderResult as { items?: unknown[] }[]
    const order = orderArray[0]

    if (!order) {
      return NextResponse.json({ error: 'You can only track orders that belong to your account.' }, { status: 403 })
    }

    // Fetch order items for this order
    const items = await query(`
      SELECT oi.orderItemId, oi.productId, oi.quantity, oi.unitPrice, 
             p.name, p.description
      FROM OrderItem oi
      JOIN Product p ON oi.productId = p.productId
      WHERE oi.orderId = ?
    `, [orderId]) as unknown[]
    const itemsArray = items as { productId: string; name: string; unitPrice: number; quantity: number }[]

    order.items = itemsArray.map(item => ({
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity
    }))

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching tracked order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}