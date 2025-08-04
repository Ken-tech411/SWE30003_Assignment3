import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch all branches
export async function GET() {
  try {
    const branches = await query(
      'SELECT branchId, location, managerName, contactNumber FROM Branch ORDER BY location'
    );
    return NextResponse.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}