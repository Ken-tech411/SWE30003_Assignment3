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
  const conn = await mysql.createConnection(db);
  const [rows] = await conn.execute('SELECT * FROM Product');
  await conn.end();
  return NextResponse.json(rows);
}
