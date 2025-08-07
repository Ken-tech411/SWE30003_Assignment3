'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AnimatedSection } from "@/components/animated-section"
import { Package } from "lucide-react"
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  requiresPrescription: boolean;
  stock?: number;
}

type Category = 'all' | 'supplement' | 'medicine' | 'device';

export default function FeaturedProducts() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching products from API...');
        
        const response = await fetch('/api/products');
        const data = await response.json();
        
        console.log('📦 Raw API Response:', data);
        console.log('📊 Response type:', typeof data);
        console.log('🔍 Is Array?', Array.isArray(data));
        
        // Handle direct array response (based on your API route)
        if (Array.isArray(data)) {
          console.log('✅ Found direct array with', data.length, 'items');
          
          // Map database fields to our Product interface
          const formattedProducts = data.map((item: unknown) => {
            const itemData = item as Record<string, unknown>;
            return {
              productId: String(itemData.productId || itemData.ProductID || itemData.id || Math.random()),
              name: String(itemData.name || itemData.Name || itemData.productName || 'Unknown Product'),
              description: String(itemData.description || itemData.Description || 'No description available'),
              price: parseFloat(String(itemData.price || itemData.Price || 0)),
              category: String(itemData.category || itemData.Category || 'other').toLowerCase(),
              requiresPrescription: Boolean(itemData.requiresPrescription || itemData.RequiresPrescription || false),
              stock: Math.floor(Math.random() * 20) + 1 // Add random stock for demo
            };
          });
          
          console.log('🎯 Formatted products:', formattedProducts);
          setProducts(formattedProducts);
          
        } else if (data.products && Array.isArray(data.products)) {
          console.log('✅ Found products array with', data.products.length, 'items');
          setProducts(data.products);
          
        } else {
          console.error('❌ Invalid data format:', data);
          // Set fallback mock data
          setMockData();
        }
        
      } catch (error) {
        console.error('💥 Error fetching products:', error);
        // Set fallback mock data
        setMockData();
      } finally {
        setLoading(false);
      }
    };

    const setMockData = () => {
      const mockProducts: Product[] = [
        {
          productId: 'mock-1',
          name: 'Vitamin C 1000mg Tablets',
          description: 'High potency vitamin C supplement',
          price: 25.99,
          category: 'supplement',
          requiresPrescription: false,
          stock: 15
        },
        {
          productId: 'mock-2',
          name: 'Digital Thermometer',
          description: 'Accurate digital thermometer',
          price: 15.99,
          category: 'device',
          requiresPrescription: false,
          stock: 8
        },
        {
          productId: 'mock-3',
          name: 'Paracetamol 500mg',
          description: 'Pain relief medication',
          price: 8.99,
          category: 'medicine',
          requiresPrescription: false,
          stock: 3
        },
        {
          productId: 'mock-4',
          name: 'Omega-3 Fish Oil Capsules',
          description: 'Essential fatty acids supplement',
          price: 32.99,
          category: 'supplement',
          requiresPrescription: false,
          stock: 12
        },
        {
          productId: 'mock-5',
          name: 'Blood Pressure Monitor',
          description: 'Digital BP monitoring device',
          price: 89.99,
          category: 'device',
          requiresPrescription: false,
          stock: 6
        },
        {
          productId: 'mock-6',
          name: 'Ibuprofen 400mg',
          description: 'Anti-inflammatory medication',
          price: 12.99,
          category: 'medicine',
          requiresPrescription: false,
          stock: 9
        },
        {
          productId: 'mock-7',
          name: 'Multivitamin Complex',
          description: 'Complete daily vitamin supplement',
          price: 28.99,
          category: 'supplement',
          requiresPrescription: false,
          stock: 18
        },
        {
          productId: 'mock-8',
          name: 'Pulse Oximeter',
          description: 'Fingertip oxygen saturation monitor',
          price: 45.99,
          category: 'device',
          requiresPrescription: false,
          stock: 4
        }
      ];
      
      console.log('🔄 Using mock data:', mockProducts);
      setProducts(mockProducts);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('🔄 Products changed:', products.length, 'items');
    console.log('🏷️ Active category:', activeCategory);
    
    if (products.length === 0) {
      console.log('⚠️ No products to filter');
      return;
    }

    let filtered: Product[] = [];

    if (activeCategory === 'all') {
      // Filter out prescription products, shuffle and take 8 random products
      const nonPrescriptionProducts = products.filter(product => !product.requiresPrescription);
      const shuffled = [...nonPrescriptionProducts].sort(() => 0.5 - Math.random());
      filtered = shuffled.slice(0, 8);
      console.log('🔀 Shuffled non-prescription products:', filtered.length);
    } else {
      // Filter by category AND exclude prescription products, take up to 8
      filtered = products
        .filter(product => {
          const matchesCategory = product.category.toLowerCase() === activeCategory.toLowerCase();
          const notPrescription = !product.requiresPrescription;
          const matches = matchesCategory && notPrescription;
          console.log(`🔍 Product "${product.name}" category "${product.category}" matches "${activeCategory}" and not prescription:`, matches);
          return matches;
        })
        .slice(0, 8);
      console.log(`🎯 Filtered ${activeCategory} non-prescription products:`, filtered.length);
    }

    setFilteredProducts(filtered);
  }, [products, activeCategory]);

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

  const categories = [
    { id: 'all' as Category, label: 'All' },
    { id: 'supplement' as Category, label: 'Supplement' },
    { id: 'medicine' as Category, label: 'Medicine' },
    { id: 'device' as Category, label: 'Device' },
  ];

  // Remove authentication requirement - let users access products page
  const handleViewAllProducts = (category?: string) => {
    const url = category && category !== 'all' 
      ? `/products?category=${encodeURIComponent(category.charAt(0).toUpperCase() + category.slice(1))}` 
      : '/products'
    
    router.push(url)
  }

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
    <AnimatedSection className="bg-white py-16">
      <div className="container mx-auto px-4">
        {/* Section Header with Filter Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <AnimatedSection delay={200}>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 md:mb-0">Featured Products</h2>
          </AnimatedSection>
          <AnimatedSection delay={400}>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 font-medium transition-colors rounded-lg ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </AnimatedSection>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700">Loading products...</span>
          </div>
        )}

        {/* Products Grid - Ensure no extra content */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {filteredProducts.map((product, index) => (
              <AnimatedSection key={product.productId} delay={600 + index * 100}>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow product-card">
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
                  
                  {/* Price - Ensure clean rendering */}
                  <div className="mb-3">
                    <span className="text-blue-600 font-bold text-lg">
                      ${Number(product.price).toFixed(2)}
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
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {activeCategory === 'all' 
                ? 'No products available at the moment.' 
                : `No ${activeCategory} products available.`
              }
            </p>
          </div>
        )}

        {/* View All Products Button - Remove authentication requirement */}
        {!loading && filteredProducts.length > 0 && (
          <AnimatedSection delay={1400}>
            <div className="text-center">
              <Button 
                onClick={() => handleViewAllProducts(activeCategory)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
              >
                {activeCategory === 'all' 
                  ? 'View All Products' 
                  : `View All ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Products`
                }
              </Button>
            </div>
          </AnimatedSection>
        )}
      </div>
    </AnimatedSection>
  );
}