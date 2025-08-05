import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const timestamp = url.searchParams.get('t');
    console.log('🔥 API: Best selling request at:', new Date().toISOString(), 'timestamp:', timestamp);

    // Get products from database
    const products = await query(`
      SELECT 
        productId, 
        name, 
        description, 
        price, 
        category, 
        requiresPrescription
      FROM Product 
      ORDER BY name ASC
      LIMIT 8
    `);

    console.log('🔥 API: Query result type:', typeof products);
    console.log('🔥 API: Is array?', Array.isArray(products));
    console.log('🔥 API: Length:', Array.isArray(products) ? products.length : 'N/A');
    console.log('🔥 API: Sample product:', Array.isArray(products) && products.length > 0 ? products[0] : 'None');

    // Always return an array, even if empty
    const productsWithStock = Array.isArray(products)
      ? products.map((product: unknown) => {
          const prod = product as { productId: string; name: string; description: string; price: number; category: string; requiresPrescription: boolean };
          return {
            ...prod,
            stock: Math.floor(Math.random() * 15) + 1,
          };
        })
      : [];

    // Add headers to prevent caching
    const response = NextResponse.json(productsWithStock);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('🔥 API Error:', error);
    // Always return an array on error for frontend compatibility
    return NextResponse.json([], { status: 200 });
  }
}