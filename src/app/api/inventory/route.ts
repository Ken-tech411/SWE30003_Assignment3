// Inventory API Route - FIXED
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch inventory with product details
export async function GET() {
  try {
    const inventory = await query(`
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
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update inventory (restock or edit)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === 'restock') {
      const { inventoryId, quantity } = body;
      if (!inventoryId || quantity === undefined || quantity <= 0) {
        return NextResponse.json(
          { error: 'Missing required fields or invalid quantity for restock' },
          { status: 400 }
        );
      }
      const result: any = await query(
        'UPDATE Inventory SET stockQuantity = stockQuantity + ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      );
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Successfully restocked ${quantity} units`,
        type: 'restock'
      });
    } else if (body.type === 'edit') {
      const { inventoryId, quantity } = body;
      if (!inventoryId || quantity === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields for edit operation' },
          { status: 400 }
        );
      }
      const result: any = await query(
        'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      );
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Inventory item updated successfully',
        type: 'edit'
      });
    } else {
      // Legacy: direct quantity update
      const { inventoryId, quantity } = body;
      if (!inventoryId || quantity === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      const result: any = await query(
        'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      );
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Inventory updated successfully'
      });
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory', details: (error as Error).message },
      { status: 500 }
    );
  }
}