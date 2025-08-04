'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AnimatedSection } from "@/components/animated-section"
import { Package } from "lucide-react"

interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  requiresPrescription: boolean;
  stock?: number;
}

export default function BestSellingProducts() {
  console.log('🎯 BestSellingProducts component is rendering!');
  console.log('🎯 Component mounted at:', new Date().toISOString());
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');

  useEffect(() => {
    console.log('🎯 useEffect triggered!');
    
    const fetchBestSellingProducts = async () => {
      try {
        console.log('🎯 Starting async fetch...');
        setLoading(true);
        setError(null);
        
        // Force no cache
        const timestamp = new Date().getTime();
        const url = `/api/products/best-selling?t=${timestamp}&nocache=${Math.random()}`;
        console.log('🔥 Component: Fetching from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store'
        });
        
        console.log('🔥 Component: Response status:', response.status);
        console.log('🔥 Component: Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔥 Component: Error response text:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const rawText = await response.text();
        console.log('🔥 Component: Raw response text:', rawText);
        
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          console.error('🔥 Component: JSON parse error:', parseError);
          throw new Error(`Invalid JSON response: ${parseError}`);
        }
        
        console.log('🔥 Component: Parsed data:', data);
        console.log('🔥 Component: Is Array?', Array.isArray(data));
        
        // Process API response
        let processedProducts: Product[] = [];
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('✅ SUCCESS: Found direct array with', data.length, 'items');
          
          processedProducts = data.map((product: any, index: number) => {
            const formatted = {
              productId: String(product.productId || product.ProductID || `api-${index}`),
              name: String(product.name || product.Name || 'Unknown Product'),
              description: String(product.description || product.Description || 'No description available'),
              price: parseFloat(product.price || product.Price || 0),
              category: String(product.category || product.Category || 'other').toLowerCase(),
              requiresPrescription: Boolean(product.requiresPrescription || product.RequiresPrescription || false),
              stock: parseInt(String(product.stock || Math.floor(Math.random() * 20) + 1))
            };
            console.log(`✅ Formatted product ${index}:`, formatted);
            return formatted;
          });
          
          setDataSource('api');
          console.log('✅ FINAL: Setting API products:', processedProducts);
          setProducts(processedProducts);
          setError(null);
          
        } else {
          console.error('❌ INVALID: Unexpected API response format');
          throw new Error(`Invalid API response format. Expected array, got: ${typeof data}`);
        }
        
      } catch (error) {
        console.error('💥 FETCH ERROR:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        setDataSource('mock');
        console.log('🔄 FALLBACK: Using mock data due to error:', errorMessage);
        setMockBestSellers();
      } finally {
        setLoading(false);
        console.log('🎯 Fetch completed, loading set to false');
      }
    };

    const setMockBestSellers = () => {
      const mockProducts: Product[] = [
        {
          productId: 'mock-1',
          name: 'Vitamin C 1000mg Immune Support Tablets',
          description: 'High potency vitamin C for immune system support',
          price: 24.99,
          category: 'supplement',
          requiresPrescription: false,
          stock: 5
        },
        {
          productId: 'mock-2',
          name: 'Advanced Pain Relief Cream with Menthol',
          description: 'Fast-acting topical pain relief cream',
          price: 18.50,
          category: 'medicine',
          requiresPrescription: false,
          stock: 8
        },
        {
          productId: 'mock-3',
          name: 'Natural Honey Cough Syrup for Adults',
          description: 'Soothing honey-based cough relief syrup',
          price: 15.75,
          category: 'medicine',
          requiresPrescription: false,
          stock: 3
        },
        {
          productId: 'mock-4',
          name: 'Antiseptic Wound Care Spray',
          description: 'Antibacterial wound cleaning spray',
          price: 12.99,
          category: 'medicine',
          requiresPrescription: false,
          stock: 12
        },
        {
          productId: 'mock-5',
          name: 'Complete Daily Multivitamin for Adults',
          description: 'Comprehensive daily vitamin and mineral supplement',
          price: 32.00,
          category: 'supplement',
          requiresPrescription: false,
          stock: 6
        },
        {
          productId: 'mock-6',
          name: 'Antibacterial Hand Sanitizer Gel',
          description: '70% alcohol antibacterial hand sanitizer',
          price: 8.99,
          category: 'device',
          requiresPrescription: false,
          stock: 15
        }
      ];
      
      console.log('🔄 MOCK: Setting mock data:', mockProducts);
      setProducts(mockProducts);
    };

    // Add setTimeout to test component mounting
    setTimeout(() => {
      console.log('🎯 Component definitely mounted, starting fetch...');
      fetchBestSellingProducts();
    }, 100);
    
  }, []);

  console.log('🎯 Render state - products:', products.length, 'loading:', loading, 'error:', error);

  // Early return for testing
  if (loading) {
    console.log('🎯 Rendering loading state');
    return (
      <AnimatedSection className="bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8">🎯 Best Selling Products (Loading...)</h2>
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Loading best sellers...</span>
            </div>
          </div>
        </div>
      </AnimatedSection>
    );
  }

  console.log('🎯 Rendering main content with', products.length, 'products');

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'supplement':
        return 'bg-green-100 text-green-800';
      case 'medicine':
        return 'bg-red-100 text-red-800';
      case 'device':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscountPercentage = () => {
    const discounts = ['-15%', '-20%', '-25%', '-30%', 'Buy 2 Get 1', 'Free Gift'];
    return discounts[Math.floor(Math.random() * discounts.length)];
  };

  const getDiscountColor = (discount: string) => {
    if (discount.includes('Buy') || discount.includes('Free')) {
      return discount.includes('Buy') ? 'bg-orange-500' : 'bg-green-500';
    }
    return 'bg-red-500';
  };

  return (
    <AnimatedSection className="bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <AnimatedSection delay={200}>
          <div className="text-center mb-8">
            <div className="inline-block bg-red-500 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg">
               Best Selling Products
            </div>
          </div>
        </AnimatedSection>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">⚠️ API Error</div>
            <div className="text-red-700 text-sm mt-1">{error}</div>
            <div className="text-red-700 text-sm mt-1">Showing sample data instead.</div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product, index) => {
            const discount = getDiscountPercentage();
            const discountColor = getDiscountColor(discount);
            
            return (
              <AnimatedSection key={product.productId} delay={400 + index * 100}>
                <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="relative mb-4">
                    <div className={`absolute top-2 left-2 ${discountColor} text-white px-2 py-1 rounded text-sm font-bold z-10`}>
                      {discount}
                    </div>
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </div>
                    </div>
                    {/* Low Stock Badge */}
                    {product.stock && product.stock <= 10 && (
                      <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                        Only {product.stock} left!
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getCategoryColor(product.category)}`}>
                      {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold text-lg">
                        ${product.price.toFixed(2)}
                      </span>
                      {discount.includes('%') && (
                        <span className="text-gray-400 line-through text-sm">
                          ${(product.price * 1.2).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.requiresPrescription && (
                      <span className="text-xs text-red-600 font-medium">Prescription Required</span>
                    )}
                  </div>
                  
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                    Add to Cart
                  </Button>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}