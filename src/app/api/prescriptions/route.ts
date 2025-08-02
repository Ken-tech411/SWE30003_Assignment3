import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;

    const statuses = searchParams.getAll('status'); // e.g. ["approved", "pending"]
    const name = searchParams.get('name') || "";
    const prescriptionId = searchParams.get('prescriptionId'); // <-- Get prescriptionId from query params

    // Build WHERE clause
    let where: string[] = [];
    let params: any[] = [];

    if (statuses.length) {
      const statusConds = statuses.map(status => {
        if (status === "approved") return "p.approved = 1";
        if (status === "rejected") return "p.approved = 0";
        if (status === "pending") return "p.approved IS NULL";
        return "1=1";
      });
      where.push(`(${statusConds.join(" OR ")})`);
    }
    if (name) {
      where.push("c.name LIKE ?");
      params.push(`%${name}%`);
    }
    if (prescriptionId) {
      where.push("p.prescriptionId = ?"); // <-- Add prescriptionId condition
      params.push(prescriptionId);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Get total count for filtered set
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM Prescription p
       LEFT JOIN \`Order\` o ON p.prescriptionId = o.prescriptionId
       LEFT JOIN Customer c ON o.customerId = c.customerId
       ${whereClause}`,
      params
    ) as any[];
    const total = totalRows[0]?.total || 0;

    // Get paginated filtered data
    const [rows] = await pool.query(
      `SELECT 
        p.prescriptionId,
        p.imageFile,
        p.uploadDate,
        p.approved,
        p.pharmacistId,
        c.name AS patientName,
        c.phoneNumber AS patientPhoneNumber
      FROM Prescription p
      LEFT JOIN \`Order\` o ON p.prescriptionId = o.prescriptionId
      LEFT JOIN Customer c ON o.customerId = c.customerId
      ${whereClause}
      ORDER BY p.uploadDate DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ) as any[];

    // Get status counts (for all data, not just filtered)
    const [statusCountsRows] = await pool.query(
      `SELECT 
        SUM(CASE WHEN p.approved IS NULL THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN p.approved = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN p.approved = 0 THEN 1 ELSE 0 END) as rejected
      FROM Prescription p`
    ) as any[];
    const statusCounts = statusCountsRows[0] || { pending: 0, approved: 0, rejected: 0 };

    return NextResponse.json({ data: rows, total, statusCounts });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('imageFile') as File | null;

    let imageFileName = null;
    if (imageFile instanceof File) {
      // Generate a unique filename to avoid collisions
      const ext = path.extname(imageFile.name);
      imageFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save to public/uploads (make sure this folder exists)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await writeFile(path.join(uploadDir, imageFileName), buffer);
    }

    // Only insert columns that exist in Prescription table
    const [result]: any = await pool.query(
      `INSERT INTO Prescription 
       (imageFile, uploadDate, approved, pharmacistId) 
       VALUES (?, NOW(), NULL, NULL)`,
      [imageFileName]
    );

    return NextResponse.json(
      { success: true, prescriptionId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription'},
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { prescriptionId, approved } = await request.json();
    await pool.query(
      `UPDATE Prescription SET approved = ? WHERE prescriptionId = ?`,
      [approved, prescriptionId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update prescription'},
      { status: 500 }
    );
  }
}