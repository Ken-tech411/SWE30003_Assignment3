'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Eye, Edit, Package, X } from 'lucide-react';

interface Product {
  productId: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
  requiresPrescription: boolean;
  stock?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
        
        // If you need to fetch inventory data to get stock levels, you can do it here
        const inventoryResponse = await fetch('/api/inventory');
        let inventoryData = [];
        if (inventoryResponse.ok) {
          inventoryData = await inventoryResponse.json();
        }

        // Merge products with stock information
        const enrichedProducts = data.map((product: any) => {
          const inventoryItem = inventoryData.find((inv: any) => inv.productId === product.productId);
          return {
            ...product,
            // Ensure price is a number
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            // Add stock information from inventory
            stock: inventoryItem?.quantity || 0,
            // Add default values if not present
            description: product.description || 'No description available',
            category: product.category || 'Uncategorized',
            requiresPrescription: product.requiresPrescription || false
          };
        });

        setProducts(enrichedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
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
    const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter;
    const status = getStockStatus(product.stock);
    const matchesStatus = statusFilter === 'All Status' || status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['All Categories', ...Array.from(new Set(products.map(p => p.category)))];

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
        // Add new product via API
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          const newProduct = await response.json();
          setProducts([...products, { ...newProduct, stock: 0 }]);
          alert('Product added successfully!');
        } else {
          throw new Error('Failed to add product');
        }
      } else if (modalType === 'edit' && selectedProduct) {
        // Update existing product via API
        const response = await fetch(`/api/products/${selectedProduct.productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          const updatedProducts = products.map(p => 
            p.productId === selectedProduct.productId 
              ? { ...p, ...productData }
              : p
          );
          setProducts(updatedProducts);
          alert('Product updated successfully!');
        } else {
          throw new Error('Failed to update product');
        }
      }
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">Manage your pharmacy inventory products</p>
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-40"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-32"
            >
              <option value="All Status">All Status</option>
              <option value="IN STOCK">In Stock</option>
              <option value="LOW STOCK">Low Stock</option>
              <option value="OUT OF STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
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
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const status = getStockStatus(product.stock);
            return (
              <div key={product.productId} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Product Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>

                {/* Product Description */}
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {product.description}
                </p>

                {/* Price and Stock */}
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                  </div>
                  <div className="text-sm text-gray-500">
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Product Details Modal */}
      {showModal && modalType === 'view' && selectedProduct && (
        <ProductViewModal 
          product={selectedProduct} 
          onClose={closeModal} 
          onEdit={() => handleEditProduct(selectedProduct)} 
        />
      )}

      {/* Edit Product Modal */}
      {showModal && modalType === 'edit' && selectedProduct && (
        <ProductFormModal 
          product={selectedProduct} 
          onClose={closeModal} 
          onSubmit={handleProductSubmit}
          title="Edit Product"
        />
      )}

      {/* Add Product Modal */}
      {showModal && modalType === 'add' && (
        <ProductFormModal 
          onClose={closeModal} 
          onSubmit={handleProductSubmit}
          title="Add New Product"
        />
      )}
    </main>
  );
}

// Product View Modal Component
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-lg p-12 flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-400" />
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
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <p className="text-2xl font-bold text-green-600">
                    ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Stock Level</label>
                  <p className="text-lg font-semibold text-gray-900">{product.stock || 0} units</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Prescription Status</label>
                  <p className={`text-sm font-medium ${product.requiresPrescription ? 'text-red-600' : 'text-green-600'}`}>
                    {product.requiresPrescription ? 'Prescription Required' : 'Over-the-Counter'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Product ID</label>
                  <p className="text-gray-900 font-mono">{product.productId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="text-gray-700 mt-2 leading-relaxed">{product.description}</p>
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

// Product Form Modal Component (for both Add and Edit)
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
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresPrescription}
                onChange={(e) => setFormData({...formData, requiresPrescription: e.target.checked})}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Requires Prescription</span>
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