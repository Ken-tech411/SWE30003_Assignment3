// Products API Route
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const db = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// GET - Fetch all products
export async function GET() {
  try {
    const conn = await mysql.createConnection(db);
    const [rows] = await conn.execute('SELECT * FROM Product');
    await conn.end();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Add new product - FIXED
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, requiresPrescription } = body;

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const conn = await mysql.createConnection(db);
    
    // Use AUTO_INCREMENT for productId instead of generating manually
    // Remove the productId from the INSERT statement and let MySQL handle it
    const [result] = await conn.execute(
      `INSERT INTO Product (name, description, price, category, requiresPrescription) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || '', parseFloat(price), category || '', requiresPrescription || false]
    );
    
    // Get the auto-generated productId
    const insertResult = result as any;
    const productId = insertResult.insertId;
    
    await conn.end();
    
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

    // Validate required fields
    if (!productId || !name || !price) {
      return NextResponse.json(
        { error: 'Product ID, name, and price are required' },
        { status: 400 }
      );
    }

    const conn = await mysql.createConnection(db);
    
    const [result] = await conn.execute(
      `UPDATE Product 
       SET name = ?, description = ?, price = ?, category = ?, requiresPrescription = ?
       WHERE productId = ?`,
      [name, description || '', parseFloat(price), category || '', requiresPrescription || false, productId]
    );
    
    await conn.end();
    
    // Check if any rows were affected
    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
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

// DELETE - Delete product (optional - if you want delete functionality)
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

    const conn = await mysql.createConnection(db);
    
    const [result] = await conn.execute(
      'DELETE FROM Product WHERE productId = ?',
      [productId]
    );
    
    await conn.end();
    
    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
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