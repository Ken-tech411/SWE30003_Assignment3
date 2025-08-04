// Products API Route
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch all products
export async function GET() {
  try {
    const products = await query('SELECT * FROM Product ORDER BY name');
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Add new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, requiresPrescription } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const result: any = await query(
      `INSERT INTO Product (name, description, price, category, requiresPrescription) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || '', parseFloat(price), category || '', requiresPrescription || false]
    );

    const productId = result.insertId;

    return NextResponse.json({
      success: true,
      productId,
      message: 'Product added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: 'Failed to add product', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update existing product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, name, description, price, category, requiresPrescription } = body;

    if (!productId || !name || !price) {
      return NextResponse.json(
        { error: 'Product ID, name, and price are required' },
        { status: 400 }
      );
    }

    const result: any = await query(
      `UPDATE Product 
       SET name = ?, description = ?, price = ?, category = ?, requiresPrescription = ?
       WHERE productId = ?`,
      [name, description || '', parseFloat(price), category || '', requiresPrescription || false, productId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const result: any = await query(
      'DELETE FROM Product WHERE productId = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}