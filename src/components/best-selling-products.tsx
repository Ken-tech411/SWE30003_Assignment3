'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AnimatedSection } from "@/components/animated-section"
import { Package } from "lucide-react"
import { useAuth } from '@/context/AuthContext'

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
  const { user } = useAuth();
  console.log('🎯 BestSellingProducts component is rendering!');
  console.log('🎯 Component mounted at:', new Date().toISOString());
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎯 useEffect triggered!');
    
    const fetchBestSellingProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const timestamp = new Date().getTime();
        const url = `/api/best-selling?t=${timestamp}&nocache=${Math.random()}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔥 Component: Error response text:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        let processedProducts: Product[] = [];
        if (Array.isArray(data) && data.length > 0) {
          processedProducts = data.map((product: unknown, index: number) => {
            const productData = product as Record<string, unknown>;
            return {
              productId: String(productData.productId || productData.ProductID || `api-${index}`),
              name: String(productData.name || productData.Name || 'Unknown Product'),
              description: String(productData.description || productData.Description || 'No description available'),
              price: parseFloat(String(productData.price || productData.Price || 0)),
              category: String(productData.category || productData.Category || 'other').toLowerCase(),
              requiresPrescription: Boolean(productData.requiresPrescription || productData.RequiresPrescription || false),
              stock: parseInt(String(productData.stock || Math.floor(Math.random() * 20) + 1))
            };
          });
          setProducts(processedProducts);
          setError(null);
        } else {
          throw new Error(`Invalid API response format. Expected array, got: ${typeof data}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        setMockBestSellers();
      } finally {
        setLoading(false);
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

  // Add the cart functionality from products page
  const addToCart = async (productId: string, requiresPrescription: boolean) => {
    if (!user || !user.customerId) {
      alert("Please sign in to add products to your cart.");
      return;
    }

    // Check if product requires prescription
    if (requiresPrescription) {
      alert("You need an approved prescription to buy this product.");
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.customerId,
          productId,
          quantity: 1
        })
      });

      if (response.ok) {
        alert("Added to cart!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add to cart.");
      }
    } catch {
      alert("Failed to add to cart.");
    }
  };

  return (
    <AnimatedSection className="bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <AnimatedSection delay={200}>
          <div className="text-center mb-8">
            <div className="inline-block bg-red-500 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg">
              🔥 Best Selling Products
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

        {/* Products Grid - Filter out prescription products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products
            .filter(product => !product.requiresPrescription)
            .slice(0, 8)
            .map((product, index) => (
            <AnimatedSection key={product.productId} delay={400 + index * 100}>
              <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                {/* Product Image */}
                <div className="relative mb-4">
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                      {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </div>
                  </div>
                </div>
                
                {/* Category Badge */}
                <div className="mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${getCategoryColor(product.category)}`}>
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </span>
                </div>
                
                {/* Product Name */}
                <h3 className="font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[3rem]">
                  {product.name}
                </h3>
                
                {/* Price */}
                <div className="mb-3">
                  <span className="text-blue-600 font-bold text-lg">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                {/* Prescription Status - Fixed height container */}
                <div className="mb-3 h-5">
                  {product.requiresPrescription ? (
                    <span className="text-xs text-red-600 font-medium">Prescription Required</span>
                  ) : null}
                </div>
                
                {/* Add to Cart Button */}
                <Button 
                  onClick={() => addToCart(product.productId, product.requiresPrescription)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  Add to Cart
                </Button>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* No Products Found Message */}
        {!loading && products.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No best selling products found.
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}