// Inventory API Route - FIXED
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
    
    // First, let's check the inventory table structure
    const [tableInfo] = await conn.execute('DESCRIBE Inventory');
    console.log('Inventory table structure:', tableInfo);
    
    // Check what's actually in the inventory table
    const [rawInventory] = await conn.execute('SELECT * FROM Inventory LIMIT 5');
    console.log('Raw inventory data:', rawInventory);
    
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

// PUT - Update inventory - FIXED to only update existing columns
export async function PUT(request: Request) {
  let conn;
  try {
    const body = await request.json();
    console.log('Received PUT request with body:', body);

    // Test database connection first
    conn = await mysql.createConnection(db);
    console.log('Database connection successful');

    // Handle both restock and edit operations
    if (body.type === 'restock') {
      // Restock operation
      const { inventoryId, quantity } = body;

      if (!inventoryId || quantity === undefined || quantity <= 0) {
        return NextResponse.json(
          { error: 'Missing required fields or invalid quantity for restock' },
          { status: 400 }
        );
      }
      
      console.log(`Restocking inventory ${inventoryId} with ${quantity} units`);
      
      // Add to existing quantity
      const [result] = await conn.execute(
        'UPDATE Inventory SET stockQuantity = stockQuantity + ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      );
      
      console.log('Restock update result:', result);

      const updateResult = result as any;
      if (updateResult.affectedRows === 0) {
        await conn.end();
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
      
      await conn.end();
      return NextResponse.json({ 
        success: true, 
        message: `Successfully restocked ${quantity} units`,
        type: 'restock'
      });

    } else if (body.type === 'edit') {
      // Edit operation - FIXED to only update columns that exist in the database
      const { inventoryId, quantity } = body;

      if (!inventoryId || quantity === undefined) {
        await conn.end();
        return NextResponse.json(
          { error: 'Missing required fields for edit operation' },
          { status: 400 }
        );
      }

      console.log(`Editing inventory ${inventoryId} with quantity:`, quantity);
      
      // Only update stockQuantity and updatedAt since these are the only editable fields in the Inventory table
      const updateQuery = 'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?';
      const updateValues = [quantity, inventoryId];

      console.log('Update query:', updateQuery, 'Values:', updateValues);

      const [result] = await conn.execute(updateQuery, updateValues);
      console.log('Edit update result:', result);
      
      const updateResult = result as any;
      if (updateResult.affectedRows === 0) {
        await conn.end();
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
      
      await conn.end();
      return NextResponse.json({ 
        success: true, 
        message: 'Inventory item updated successfully',
        type: 'edit'
      });

    } else {
      // Legacy support - direct quantity update
      const { inventoryId, quantity } = body;

      if (!inventoryId || quantity === undefined) {
        await conn.end();
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      console.log(`Legacy update for inventory ${inventoryId} with quantity ${quantity}`);
      
      // Set absolute quantity
      const [result] = await conn.execute(
        'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      );
      
      console.log('Legacy update result:', result);

      const updateResult = result as any;
      if (updateResult.affectedRows === 0) {
        await conn.end();
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
      
      await conn.end();
      return NextResponse.json({ 
        success: true, 
        message: 'Inventory updated successfully'
      });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    if (conn) {
      await conn.end();
    }
    return NextResponse.json(
      { error: 'Failed to update inventory', details: (error as Error).message },
      { status: 500 }
    );
  }
}