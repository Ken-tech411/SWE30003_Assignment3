// Inventory API Route
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch inventory with product details and branch information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId'); // Optional branch filter

    let inventoryQuery = `
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
        p.requiresPrescription,
        b.location as branchLocation,
        b.managerName,
        b.contactNumber
      FROM Inventory i
      LEFT JOIN Product p ON i.productId = p.productId
      LEFT JOIN Branch b ON i.branchId = b.branchId
    `;

    const queryParams: unknown[] = [];

    // Add branch filter if specified
    if (branchId) {
      inventoryQuery += ` WHERE i.branchId = ?`;
      queryParams.push(branchId);
    }

    inventoryQuery += ` ORDER BY i.branchId ASC, COALESCE(p.name, 'Unknown') ASC`;

    const inventory = await query(inventoryQuery, queryParams);
    
    return NextResponse.json({ 
      inventory,
      totalItems: Array.isArray(inventory) ? inventory.length : 0
    });
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
      
      const result = await query(
        'UPDATE Inventory SET stockQuantity = stockQuantity + ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      ) as { affectedRows: number };
      
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
      
      const result = await query(
        'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      ) as { affectedRows: number };
      
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
      
    } else if (body.type === 'transfer') {
      // New functionality: Transfer stock between branches
      const { fromBranchId, toBranchId, productId, quantity } = body;
      
      if (!fromBranchId || !toBranchId || !productId || !quantity) {
        return NextResponse.json(
          { error: 'Missing required fields for transfer' },
          { status: 400 }
        );
      }

      // Start transaction
      await query('START TRANSACTION');
      
      try {
        // Check if source has enough stock
        const sourceInventory = await query(
          'SELECT stockQuantity FROM Inventory WHERE branchId = ? AND productId = ?',
          [fromBranchId, productId]
        ) as { stockQuantity: number }[];
        
        if (!Array.isArray(sourceInventory) || sourceInventory.length === 0 || sourceInventory[0].stockQuantity < quantity) {
          await query('ROLLBACK');
          return NextResponse.json(
            { error: 'Insufficient stock for transfer' },
            { status: 400 }
          );
        }

        // Reduce stock from source branch
        await query(
          'UPDATE Inventory SET stockQuantity = stockQuantity - ?, updatedAt = NOW() WHERE branchId = ? AND productId = ?',
          [quantity, fromBranchId, productId]
        );

        // Check if destination inventory exists
        const destInventory = await query(
          'SELECT inventoryId FROM Inventory WHERE branchId = ? AND productId = ?',
          [toBranchId, productId]
        ) as { inventoryId: number }[];

        if (Array.isArray(destInventory) && destInventory.length > 0) {
          // Update existing inventory
          await query(
            'UPDATE Inventory SET stockQuantity = stockQuantity + ?, updatedAt = NOW() WHERE branchId = ? AND productId = ?',
            [quantity, toBranchId, productId]
          );
        } else {
          // Create new inventory record
          await query(
            'INSERT INTO Inventory (branchId, productId, stockQuantity, updatedAt) VALUES (?, ?, ?, NOW())',
            [toBranchId, productId, quantity]
          );
        }

        await query('COMMIT');
        
        return NextResponse.json({
          success: true,
          message: `Successfully transferred ${quantity} units between branches`,
          type: 'transfer'
        });

      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
      
    } else {
      // Legacy: direct quantity update
      const { inventoryId, quantity } = body;
      if (!inventoryId || quantity === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      const result = await query(
        'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?',
        [quantity, inventoryId]
      ) as { affectedRows: number };
      
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

// POST - Add new inventory item to a branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, productId, stockQuantity } = body;

    if (!branchId || !productId || stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Branch ID, Product ID, and stock quantity are required' },
        { status: 400 }
      );
    }

    // Check if inventory item already exists
    const existing = await query(
      'SELECT inventoryId FROM Inventory WHERE branchId = ? AND productId = ?',
      [branchId, productId]
    ) as { inventoryId: number }[];

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: 'Inventory item already exists for this branch and product' },
        { status: 409 }
      );
    }

    const result = await query(
      'INSERT INTO Inventory (branchId, productId, stockQuantity, updatedAt) VALUES (?, ?, ?, NOW())',
      [branchId, productId, stockQuantity]
    ) as { insertId: number };

    return NextResponse.json({
      success: true,
      inventoryId: result.insertId,
      message: 'Inventory item added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to add inventory item' },
      { status: 500 }
    );
  }
}