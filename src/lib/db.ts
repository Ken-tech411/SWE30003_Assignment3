import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lcpms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

export async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function query(sql: string, params?: unknown[]) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
