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
    
    if (Array.isArray(products) && products.length > 0) {
      // Add mock stock data for each product
      const productsWithStock = products.map((product: any, index: number) => ({
        ...product,
        stock: Math.floor(Math.random() * 15) + 1
      }));
      
      console.log('🔥 API: Returning products count:', productsWithStock.length);
      console.log('🔥 API: First product after processing:', productsWithStock[0]);
      
      // Add headers to prevent caching
      const response = NextResponse.json(productsWithStock);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } else {
      console.log('🔥 API: No products found in database');
      return NextResponse.json([]);
    }
    
  } catch (error) {
    console.error('🔥 API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch best selling products',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}