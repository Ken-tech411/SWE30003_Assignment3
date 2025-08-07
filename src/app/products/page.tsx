// Products Management Page with Pagination
'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Eye, Edit, Package, X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Footer } from '@/components/footer';

interface Product {
  productId: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
  requiresPrescription: boolean;
  stock?: number;
}

type ModalType = 'view' | 'edit' | 'add';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('view');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Initialize search term and category from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const categoryQuery = urlParams.get('category');

    if (searchQuery) setSearchTerm(searchQuery);
    if (categoryQuery) {
      // Capitalize first letter to match database format
      const formattedCategory = categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1).toLowerCase();
      setCategoryFilter(formattedCategory);
    }
  }, []);

  // Listen for URL changes (when navigating from navbar)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('search') || '';
      const categoryQuery = urlParams.get('category') || 'All Categories';

      setSearchTerm(searchQuery);

      if (categoryQuery !== 'All Categories') {
        const formattedCategory = categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1).toLowerCase();
        setCategoryFilter(formattedCategory);
      } else {
        setCategoryFilter('All Categories');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Patch pushState/replaceState to trigger filter update
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(handlePopState, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handlePopState, 0);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        const data = await response.json();

        // Fetch inventory data to get stock levels
        const inventoryResponse = await fetch('/api/inventory');
        let inventoryData = [];
        if (inventoryResponse.ok) {
          const inventoryResult = await inventoryResponse.json();
          inventoryData = inventoryResult.inventory || [];
        }

        // Merge products with stock information
        const enrichedProducts = (data.products || []).map((product: Record<string, unknown>) => {
          const inventoryItem = inventoryData.find((inv: Record<string, unknown>) => inv.productId === product.productId);
          return {
            ...product,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            stock: inventoryItem?.quantity || 0,
            description: product.description || 'No description available',
            category: product.category || 'Uncategorized',
            requiresPrescription: product.requiresPrescription || false
          };
        });

        setProducts(enrichedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getStockStatus = (stock: number = 0) => {
    if (stock === 0) return 'OUT OF STOCK';
    if (stock <= 30) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN STOCK': return 'bg-green-500 text-white';
      case 'LOW STOCK': return 'bg-orange-500 text-white';
      case 'OUT OF STOCK': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    // Enhanced case-insensitive category matching
    let matchesCategory = false;
    if (categoryFilter === 'All Categories') {
      matchesCategory = true;
    } else {
      const filterLower = categoryFilter.toLowerCase().trim();
      const productCategoryLower = (product.category || '').toLowerCase().trim();
      matchesCategory = productCategoryLower === filterLower;
    }

    const status = getStockStatus(product.stock);
    const matchesStatus = statusFilter === 'All Status' || status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    // Sort products with search term match first
    if (searchTerm) {
      const aNameMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const bNameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      // If both match, sort by how close the match is (exact match first, then starts with, then contains)
      const aExactMatch = a.name.toLowerCase() === searchTerm.toLowerCase();
      const bExactMatch = b.name.toLowerCase() === searchTerm.toLowerCase();

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      const aStartsWith = a.name.toLowerCase().startsWith(searchTerm.toLowerCase());
      const bStartsWith = b.name.toLowerCase().startsWith(searchTerm.toLowerCase());

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);


  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const categories = ['All Categories', ...Array.from(new Set(products.map(p => p.category)))];

  // Customer functions
  const addToCart = async (productId: string) => {
    if (!user || !user.customerId) {
      alert("Please sign in to add products to your cart.");
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

  // Staff modal handlers
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalType('view');
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalType('edit');
    setShowModal(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setModalType('add');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const handleProductSubmit = async (productData: Partial<Product>) => {
    try {
      if (modalType === 'add') {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          throw new Error('Failed to add product');
        }

        const result = await response.json();

        const newProduct: Product = {
          productId: result.productId,
          name: productData.name || '',
          description: productData.description || '',
          price: productData.price || 0,
          category: productData.category || '',
          requiresPrescription: productData.requiresPrescription || false,
          stock: 0
        };
        setProducts([...products, newProduct]);
        alert('Product added successfully!');

      } else if (modalType === 'edit' && selectedProduct) {
        const response = await fetch('/api/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: selectedProduct.productId,
            ...productData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update product');
        }

        const updatedProducts = products.map(p =>
          p.productId === selectedProduct.productId
            ? { ...p, ...productData }
            : p
        );
        setProducts(updatedProducts);
        alert('Product updated successfully!');
      }
      closeModal();
    } catch {
      alert('Failed to save product. Please try again.');
    }
  };

  // Pagination Component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col items-center mt-12 space-y-4">
        {/* Results Counter */}
        <div className="text-base text-gray-700 font-medium">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} products
        </div>
        {/* Pagination Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center px-5 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600 bg-white border border-gray-300 hover:border-orange-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>
          <div className="flex space-x-2">
            {generatePageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-w-[48px] ${
                  currentPage === pageNum
                    ? 'bg-orange-500 text-white shadow-lg transform scale-105 border-2 border-orange-500'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 bg-white border border-gray-300 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center px-5 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600 bg-white border border-gray-300 hover:border-orange-300'
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    );
  };

  // Show loading while checking authentication
  if (user === undefined) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-700">Loading...</span>
        </div>
      </main>
    );
  }

  // Show access denied for unauthenticated users 
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please sign in to access the product browse system.</p>
            <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-700">Loading products...</span>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 font-medium">Error loading products</div>
          </div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // Customer View
  if (user?.role === 'customer') {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-6 bg-gray-50">
          {/* Customer Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Products</h1>
              <p className="text-gray-700">Find the products you need</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-40 text-gray-900"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-32 text-gray-900"
                >
                  <option value="All Status">All Status</option>
                  <option value="IN STOCK">In Stock</option>
                  <option value="LOW STOCK">Low Stock</option>
                  <option value="OUT OF STOCK">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid - Customer View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentProducts.map(product => {
              const status = getStockStatus(product.stock);
              const isOutOfStock = status === 'OUT OF STOCK';
              return (
                <div key={product.productId} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  {/* Product Image Placeholder */}
                  <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>

                  <div className="p-4">
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>

                    {/* Category */}
                    <p className="text-sm text-orange-600 font-medium mb-2">{product.category}</p>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price */}
                    <div className="text-2xl font-bold text-gray-900 mb-3">
                      ${Number(product.price).toFixed(2)}
                    </div>

                    {/* Prescription Status */}
                    {product.requiresPrescription && (
                      <div className="mb-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                          Prescription Required
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => addToCart(product.productId)}
                        disabled={isOutOfStock}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <PaginationComponent />

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}

          {/* Customer View Modal */}
          {showModal && modalType === 'view' && selectedProduct && (
            <CustomerProductViewModal
              product={selectedProduct}
              onClose={closeModal}
              onAddToCart={addToCart}
            />
          )}
        </main>
        <Footer />
      </div>
    );
  }

  // Staff View (pharmacist/admin)
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-6 bg-gray-50">
        {/* Staff Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Products Management</h1>
            <p className="text-gray-700">Manage your pharmacy inventory products</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-40 text-gray-900"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-32 text-gray-900"
              >
                <option value="All Status">All Status</option>
                <option value="IN STOCK">In Stock</option>
                <option value="LOW STOCK">Low Stock</option>
                <option value="OUT OF STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid - Staff View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map(product => {
            const status = getStockStatus(product.stock);
            return (
              <div key={product.productId} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Product Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-orange-600 font-medium">{product.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>

                {/* Product Description */}
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                  {product.description}
                </p>

                {/* Price and Stock */}
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${Number(product.price).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-700">
                    Stock: {product.stock || 0} units
                  </div>
                </div>

                {/* Prescription Status */}
                <div className="mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.requiresPrescription
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.requiresPrescription ? 'Prescription Required' : 'Over-the-Counter'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProduct(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <PaginationComponent />

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Modals - Only for Staff */}
        {showModal && modalType === 'view' && selectedProduct && (
          <ProductViewModal
            product={selectedProduct}
            onClose={closeModal}
            onEdit={() => handleEditProduct(selectedProduct)}
          />
        )}

        {showModal && modalType === 'edit' && selectedProduct && (
          <ProductFormModal
            product={selectedProduct}
            onClose={closeModal}
            onSubmit={handleProductSubmit}
            title="Edit Product"
          />
        )}

        {showModal && modalType === 'add' && (
          <ProductFormModal
            onClose={closeModal}
            onSubmit={handleProductSubmit}
            title="Add New Product"
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

// Product View Modal Component (for staff)
function ProductViewModal({ product, onClose, onEdit }: {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}) {
  const getStockStatus = (stock: number = 0) => {
    if (stock === 0) return 'OUT OF STOCK';
    if (stock <= 30) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN STOCK': return 'bg-green-500 text-white';
      case 'LOW STOCK': return 'bg-orange-500 text-white';
      case 'OUT OF STOCK': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 rounded-lg p-12 flex items-center justify-center">
              <Package className="w-16 h-16 text-orange-500" />
            </div>

            <div>
              <div className="mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getStockStatus(product.stock))}`}>
                  {getStockStatus(product.stock)}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-orange-600 font-medium mb-4">{product.category}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Price</label>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(product.price).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Stock Level</label>
                  <p className="text-lg font-semibold text-gray-900">{product.stock || 0} units</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Prescription Status</label>
                  <p className={`text-sm font-medium ${product.requiresPrescription ? 'text-red-600' : 'text-green-600'}`}>
                    {product.requiresPrescription ? 'Prescription Required' : 'Over-the-Counter'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Product ID</label>
                  <p className="text-gray-900 font-mono">{product.productId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600">Description</label>
            <p className="text-gray-800 mt-2 leading-relaxed">{product.description}</p>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Form Modal Component (for staff - both Add and Edit)
function ProductFormModal({ product, onClose, onSubmit, title }: {
  product?: Product;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => void;
  title: string;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || '',
    requiresPrescription: product?.requiresPrescription || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.price) {
      onSubmit({
        ...formData,
        price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresPrescription}
                onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-800">Requires Prescription</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
            >
              {product ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Customer Product View Modal Component
function CustomerProductViewModal({ product, onClose, onAddToCart }: {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: string) => void;
}) {
  const getStockStatus = (stock: number = 0) => {
    if (stock === 0) return 'OUT OF STOCK';
    if (stock <= 30) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN STOCK': return 'bg-green-500 text-white';
      case 'LOW STOCK': return 'bg-orange-500 text-white';
      case 'OUT OF STOCK': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const status = getStockStatus(product.stock);
  const isOutOfStock = status === 'OUT OF STOCK';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 rounded-lg p-12 flex items-center justify-center">
              <Package className="w-16 h-16 text-orange-500" />
            </div>

            <div>
              <div className="mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-orange-600 font-medium mb-4">{product.category}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Price</label>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(product.price).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Stock Level</label>
                  <p className="text-lg font-semibold text-gray-900">{product.stock || 0} units</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Prescription Status</label>
                  <p className={`text-sm font-medium ${product.requiresPrescription ? 'text-red-600' : 'text-green-600'}`}>
                    {product.requiresPrescription ? 'Prescription Required' : 'Over-the-Counter'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Product ID</label>
                  <p className="text-gray-900 font-mono">{product.productId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600">Description</label>
            <p className="text-gray-800 mt-2 leading-relaxed">{product.description}</p>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => {
                onAddToCart(product.productId);
                onClose();
              }}
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                isOutOfStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};