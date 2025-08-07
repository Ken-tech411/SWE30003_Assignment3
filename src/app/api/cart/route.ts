import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

interface CartItem {
  cartId?: number
  customerId: number
  productId: number
  quantity: number
  createdAt?: Date
}

interface Product {
  productId: number
  name: string
  price: number
  description: string
  requiresPrescription: boolean
}

interface CartItemWithProduct extends CartItem, Product {}

function isArrayOfCartItems(result: unknown): result is CartItemWithProduct[] {
  return (
    Array.isArray(result) &&
    result.every(
      (item) =>
        'productId' in item &&
        'name' in item &&
        'price' in item &&
        'requiresPrescription' in item
    )
  )
}

function getErrorMessage(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: string }).message)
    : 'An unknown error occurred'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      )
    }

    // FIX: Destructure to get only rows
    const [rows] = await pool.query(
      `SELECT c.cartId, c.customerId, c.productId, c.quantity, c.createdAt,
              p.productId, p.name, p.price, p.description, p.requiresPrescription
       FROM Cart c
       JOIN Product p ON c.productId = p.productId
       WHERE c.customerId = ?
       ORDER BY c.createdAt DESC`,
      [customerId]
    )

    if (!isArrayOfCartItems(rows)) {
      throw new Error('Unexpected query result format')
    }

    const cartItems = rows.map((row) => ({
      cartId: row.cartId,
      customerId: row.customerId,
      productId: row.productId,
      name: row.name,
      price: row.price,
      quantity: row.quantity,
      description: row.description,
      requiresPrescription: Boolean(row.requiresPrescription), 
    }))

    return NextResponse.json({ cartItems })
  } catch (error: unknown) {
    console.error('Error fetching cart items:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch cart items',
        details: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customerId, productId, quantity } = await request.json()

    if (!customerId || !productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, productId, or quantity' },
        { status: 400 }
      )
    }

    // Check if product requires prescription
    const [productRow] = await pool.query(
      `SELECT requiresPrescription FROM Product WHERE productId = ?`,
      [productId]
    ) as unknown[]
    const productRows = productRow as { requiresPrescription: boolean }[]
    const product = productRows?.[0]

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.requiresPrescription) {
      // Check if customer has at least one approved prescription
      const [prescriptions] = await pool.query(
        `SELECT 1 FROM Prescription WHERE customerId = ? AND approved = 1 LIMIT 1`,
        [customerId]
      ) as unknown[]
      const prescriptionRows = prescriptions as unknown[]
      if (!prescriptionRows || prescriptionRows.length === 0) {
        return NextResponse.json(
          { error: 'You need an approved prescription to buy this product.' },
          { status: 403 }
        )
      }
    }

    // Add to cart logic (existing)
    const [existing] = await pool.query(
      `SELECT * FROM Cart WHERE customerId = ? AND productId = ?`,
      [customerId, productId]
    ) as unknown[]
    const existingRows = existing as unknown[]

    if (existingRows.length > 0) {
      await pool.query(
        `UPDATE Cart SET quantity = quantity + ? WHERE customerId = ? AND productId = ?`,
        [quantity, customerId, productId]
      )
    } else {
      await pool.query(
        `INSERT INTO Cart (customerId, productId, quantity, createdAt)
         VALUES (?, ?, ?, NOW())`,
        [customerId, productId, quantity]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      {
        error: 'Failed to add to cart',
        details: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { customerId, productId, quantity } = await request.json()

    if (!customerId || !productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing customerId, productId, or quantity' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      await pool.query(`DELETE FROM Cart WHERE customerId = ? AND productId = ?`, [
        customerId,
        productId,
      ])
    } else {
      await pool.query(
        `UPDATE Cart SET quantity = ? WHERE customerId = ? AND productId = ?`,
        [quantity, customerId, productId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      {
        error: 'Failed to update cart',
        details: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cartId = searchParams.get('cartId')
    const customerId = searchParams.get('customerId')

    if (cartId) {
      await pool.query(`DELETE FROM Cart WHERE cartId = ?`, [cartId])
      return NextResponse.json({ success: true })
    }

    if (customerId) {
      await pool.query(`DELETE FROM Cart WHERE customerId = ?`, [customerId])
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Missing cartId or customerId parameter' },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove from cart',
        details: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
