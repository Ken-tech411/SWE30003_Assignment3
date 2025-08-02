import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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

    const result = await query(
      `SELECT c.cartId, c.customerId, c.productId, c.quantity, c.createdAt,
              p.productId, p.name, p.price, p.description, p.requiresPrescription
       FROM Cart c
       JOIN Product p ON c.productId = p.productId
       WHERE c.customerId = ?
       ORDER BY c.createdAt DESC`,
      [customerId]
    )

    if (!isArrayOfCartItems(result)) {
      throw new Error('Unexpected query result format')
    }

    return NextResponse.json({ cartItems: result })
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
        {
          error: 'Missing required fields: customerId, productId, or quantity',
        },
        { status: 400 }
      )
    }

    // Check if product requires prescription
    const productResult = await query(
      `SELECT requiresPrescription FROM Product WHERE productId = ?`,
      [productId]
    )

    const [product] = productResult as { requiresPrescription: boolean }[]

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.requiresPrescription) {
      const prescriptionResult = await query(
        `SELECT 1 FROM Prescription 
         WHERE customerId = ? AND productId = ? AND approved = 1`,
        [customerId, productId]
      )

      if (!Array.isArray(prescriptionResult) || prescriptionResult.length === 0) {
        return NextResponse.json(
          { error: 'This product requires an approved prescription' },
          { status: 403 }
        )
      }
    }

    // Check if item already exists in cart
    const existingItemResult = await query(
      `SELECT * FROM Cart WHERE customerId = ? AND productId = ?`,
      [customerId, productId]
    )

    if (!Array.isArray(existingItemResult)) {
      throw new Error('Unexpected existing item query result format')
    }

    if (existingItemResult.length > 0) {
      await query(
        `UPDATE Cart SET quantity = quantity + ? 
         WHERE customerId = ? AND productId = ?`,
        [quantity, customerId, productId]
      )
    } else {
      await query(
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
      await query(`DELETE FROM Cart WHERE customerId = ? AND productId = ?`, [
        customerId,
        productId,
      ])
    } else {
      await query(
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
      await query(`DELETE FROM Cart WHERE cartId = ?`, [cartId])
      return NextResponse.json({ success: true })
    }

    if (customerId) {
      await query(`DELETE FROM Cart WHERE customerId = ?`, [customerId])
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
