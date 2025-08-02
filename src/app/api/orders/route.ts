import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all orders with customer info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost')
    const orderId = searchParams.get('orderId')
    let orders

    if (orderId) {
      // Fetch the order with customer info
      orders = await query(`
        SELECT o.*, c.name as customerName, c.email as customerEmail, c.address as customerAddress
        FROM \`Order\` o
        JOIN Customer c ON o.customerId = c.customerId
        WHERE o.orderId = ?
      `, [orderId]) as any[];

      // Fetch order items for this order
      const items = await query(`
        SELECT oi.orderItemId, oi.productId, oi.quantity, oi.unitPrice as price, 
               p.name as productName, p.description as productDescription
        FROM OrderItem oi
        JOIN Product p ON oi.productId = p.productId
        WHERE oi.orderId = ?
      `, [orderId]) as any[];

      // Attach items to the order
      if (orders.length > 0) {
        orders[0].items = items;
      }
    } else {
      // Fetch all orders with customer info (no items)
      orders = await query(`
        SELECT o.*, c.name as customerName, c.email as customerEmail, c.address as customerAddress
        FROM \`Order\` o
        JOIN Customer c ON o.customerId = c.customerId
        ORDER BY o.orderDate DESC
      `) as any[];
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let {
      customerId,
      customer, // optional: object with customer fields
      totalAmount,
      status,
      prescriptionId, // optional
      items // array of { productId, quantity, price }
    } = body;

    if (!customerId && !customer) {
      return NextResponse.json(
        { error: 'Missing customerId or customer data' },
        { status: 400 }
      );
    }

    // If customerId is not provided, insert new customer and get the id
    if (!customerId && customer) {
      const customerResult: any = await query(
        `INSERT INTO Customer (name, phoneNumber, email, address, dateOfBirth, gender)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          customer.name,
          customer.phoneNumber,
          customer.email,
          customer.address,
          customer.dateOfBirth,
          customer.gender,
        ]
      );
      customerId = customerResult.insertId;
    }

    if (!customerId || !totalAmount || !status || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, totalAmount, status, or items' },
        { status: 400 }
      );
    }

    // Insert into Order table (prescriptionId is optional)
    const orderResult: any = await query(
      `INSERT INTO \`Order\` (customerId, totalAmount, status, orderDate${prescriptionId ? ', prescriptionId' : ''})
       VALUES (?, ?, ?, NOW()${prescriptionId ? ', ?' : ''})`,
      prescriptionId
        ? [customerId, totalAmount, status, prescriptionId]
        : [customerId, totalAmount, status]
    );

    const orderId = orderResult.insertId;

    // Insert order items into OrderItem table
    for (const item of items) {
      await query(
        `INSERT INTO OrderItem (orderId, productId, quantity, unitPrice)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    return NextResponse.json({ success: true, orderId, customerId });
  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: 'Failed to place order', details: String(error) }, { status: 500 });
  }
}

// PUT to update order status
export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 })
    }
    await query(
      'UPDATE `Order` SET status = ? WHERE orderId = ?',
      [status, orderId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
