import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const db = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function GET() {
  try {
    console.log('Connecting to database with config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    const conn = await mysql.createConnection(db);
    
    // First, let's try a simple query to check if tables exist
    const [tables] = await conn.execute('SHOW TABLES');
    console.log('Available tables:', tables);
    
    // Join Inventory with Product to get product details
    const [rows] = await conn.execute(`
      SELECT 
        i.inventoryId,
        i.productId,
        i.branchId,
        i.stockQuantity as quantity,
        i.updatedAt,
        p.name,
        p.description,
        p.price,
        p.category,
        p.requiresPrescription
      FROM Inventory i
      LEFT JOIN Product p ON i.productId = p.productId
      ORDER BY COALESCE(p.name, 'Unknown') ASC
    `);
    
    console.log('Query result:', rows);
    await conn.end();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { inventoryId, quantity, type } = body;

    if (!inventoryId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const conn = await mysql.createConnection(db);
    
    if (type === 'restock') {
      // Add to existing quantity
      await conn.execute(
        'UPDATE Inventory SET stockQuantity = stockQuantity + ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      );
    } else {
      // Set absolute quantity
      await conn.execute(
        'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      );
    }
    
    await conn.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}