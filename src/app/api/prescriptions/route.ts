import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;

    // Get user info from session/cookie
    const cookieStore = await cookies();
    const sessionToken =
      request.headers.get('authorization') ||
      cookieStore.get('sessionToken')?.value;

    let user: {
      userId: number;
      username: string;
      role: string;
      linkedId: number | null;
    } | null = null;
    if (sessionToken) {
      const [sessions] = await pool.query(
        `SELECT u.userId, u.username, u.role, u.linkedId
         FROM UserSession s
         JOIN UserAccount u ON s.userId = u.userId
         WHERE s.sessionToken = ? AND s.isActive = 1`,
        [sessionToken]
      ) as unknown as Array<{
        userId: number;
        username: string;
        role: string;
        linkedId: number | null;
      }>;
      user = Array.isArray(sessions) ? sessions[0] || null : null;
    }

    const statuses = searchParams.getAll('status'); // e.g. ["approved", "pending"]
    const name = searchParams.get('name') || "";
    const prescriptionId = searchParams.get('prescriptionId');
    const customerId = searchParams.get('customerId');

    // Build WHERE clause
    const where: string[] = [];
    const params: (string | number | null)[] = [];

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
      where.push("p.prescriptionId = ?");
      params.push(prescriptionId);
    }
    // Allow filtering by customerId from query param (for cart logic, etc)
    if (customerId) {
      where.push("p.customerId = ?");
      params.push(customerId);
    }
    // Only allow customer to see their own prescriptions (UI)
    if (user && user.role === "customer" && user.linkedId) {
      where.push("p.customerId = ?");
      params.push(user.linkedId);
    }
    // (Pharmacist/staff logic can be added here)

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Get total count for filtered set
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM Prescription p
       LEFT JOIN \`Order\` o ON p.prescriptionId = o.prescriptionId
       LEFT JOIN Customer c ON o.customerId = c.customerId
       ${whereClause}`,
      params
    ) as unknown as Array<{ total: number }>;
    const total = Array.isArray(totalRows) ? totalRows[0]?.total || 0 : 0;

    // Get paginated filtered data
    const [rows] = await pool.query(
      `SELECT 
        p.prescriptionId,
        p.imageFile,
        p.uploadDate,
        p.approved,
        p.pharmacistId,
        p.customerId
      FROM Prescription p
      ${whereClause}
      ORDER BY p.uploadDate DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ) as unknown as Array<{
      prescriptionId: number;
      imageFile: string;
      uploadDate: string;
      approved: number | null;
      pharmacistId: number | null;
      customerId: number;
    }>;

    // Get status counts (for all data, not just filtered)
    const [statusCountsRows] = await pool.query(
      `SELECT 
        SUM(CASE WHEN p.approved IS NULL THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN p.approved = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN p.approved = 0 THEN 1 ELSE 0 END) as rejected
      FROM Prescription p`
    ) as unknown as Array<{ pending: number; approved: number; rejected: number }>;
    const statusCounts = Array.isArray(statusCountsRows) ? statusCountsRows[0] || { pending: 0, approved: 0, rejected: 0 } : { pending: 0, approved: 0, rejected: 0 };

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
    const customerId = formData.get('customerId'); // from frontend

    let imageFileName = null;
    if (imageFile instanceof File) {
      const ext = path.extname(imageFile.name);
      imageFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await writeFile(path.join(uploadDir, imageFileName), buffer);
    }

    // Insert with customerId
    const resultArr = await pool.query(
      `INSERT INTO Prescription (imageFile, uploadDate, approved, pharmacistId, customerId) 
       VALUES (?, NOW(), NULL, NULL, ?)`,
      [imageFileName, customerId]
    );
    const result = Array.isArray(resultArr) ? resultArr[0] as { insertId: number } : { insertId: 0 };

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