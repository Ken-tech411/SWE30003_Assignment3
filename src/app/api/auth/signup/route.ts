import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password, role, name, phoneNumber, email, address, dateOfBirth, gender } = await request.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    let linkedId = null;

    if (role === "customer") {
      // Try to find existing customer by name (or email, etc.)
      const [existing] = await pool.query(
        `SELECT customerId FROM Customer WHERE name = ? LIMIT 1`,
        [name]
      ) as unknown[];
      const existingRows = existing as { customerId: number }[];
      if (existingRows.length > 0) {
        linkedId = existingRows[0].customerId;
      } else {
        // Insert new customer if not found
        const [result] = await pool.query(
          `INSERT INTO Customer (name, phoneNumber, email, address, dateOfBirth, gender) VALUES (?, ?, ?, ?, ?, ?)`,
          [name || "", phoneNumber || "", email || "", address || "", dateOfBirth || null, gender || ""]
        ) as unknown[];
        const insertResult = result as { insertId: number };
        linkedId = insertResult.insertId;
      }
    }
    // You can add similar logic for pharmacist if needed

    await pool.query(
      `INSERT INTO UserAccount (username, passwordHash, role, linkedId) VALUES (?, ?, ?, ?)`,
      [username, passwordHash, role, linkedId]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}