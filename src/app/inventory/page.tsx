// Inventory Management Page - Complete with Export Modal
'use client';

import { useEffect, useState } from 'react';
import { Search, Download, RefreshCw, TrendingUp, TrendingDown, Minus, Edit, Package, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Inventory {
  inventoryId: string;
  productId: string;
  branchId: string;
  quantity: number;
  threshold?: number;
  category?: string;
  name?: string;
  cost?: number;
  lastRestocked?: string;
}

interface Product {
  productId: string;
  name: string;
  category?: string;
}

interface ExportConfig {
  reportType: 'summary' | 'detailed' | 'lowstock' | 'outofstock';
  format: 'csv' | 'xlsx';
  category: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  stockThreshold: number;
  includeMetadata: boolean;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'restock' | 'edit'>('view');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch inventory and products in parallel
        const [inventoryRes, productsRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/products')
        ]);

        if (!inventoryRes.ok) {
          throw new Error(`Failed to fetch inventory: ${inventoryRes.status}`);
        }
        if (!productsRes.ok) {
          throw new Error(`Failed to fetch products: ${productsRes.status}`);
        }

        const [inventoryResult, productsResult] = await Promise.all([
          inventoryRes.json(),
          productsRes.json()
        ]);

        // Access the inventory array from the response object
        const inventoryData = inventoryResult.inventory || [];
        const productsData = productsResult.products || [];

        // Merge inventory with product information
        const enrichedInventory = inventoryData.map((item: any) => {
          const product = productsData.find((p: any) => p.productId === item.productId);
          return {
            ...item,
            name: product?.name || 'Unknown Product',
            category: product?.category || 'Unknown',
            cost: Number(product?.price || 0),
            quantity: item.quantity || 0,
            threshold: item.threshold || 30,
            lastRestocked: item.lastRestocked || new Date().toISOString().split('T')[0]
          };
        });

        setInventoryList(enrichedInventory);
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (user === undefined) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please sign in to access the inventory management system.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!user.role || (user.role !== 'pharmacist' && user.role !== 'admin')) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only pharmacists and administrators can access the inventory management system.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }
  
  const getStatus = (quantity: number, threshold: number = 30): string => {
    if (quantity === 0) return 'OUT OF STOCK';
    if (quantity <= threshold) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN STOCK': return 'bg-green-100 text-green-800';
      case 'LOW STOCK': return 'bg-orange-100 text-orange-800';
      case 'OUT OF STOCK': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (quantity: number, threshold: number = 30) => {
    if (quantity === 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (quantity <= threshold) return <TrendingDown className="w-4 h-4 text-orange-500" />;
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  };

  const filteredInventory = inventoryList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    const status = getStatus(item.quantity, item.threshold);
    const matchesStatus = statusFilter === 'All Status' || status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalProducts = inventoryList.length;
  const lowStockItems = inventoryList.filter(item => item.quantity > 0 && item.quantity <= (item.threshold || 30)).length;
  const outOfStockItems = inventoryList.filter(item => item.quantity === 0).length;
  const totalValue = inventoryList.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0);

  const categories = ['All Categories', ...Array.from(new Set(inventoryList.map(item => item.category).filter(Boolean)))];

  const handleExport = () => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      alert('Access Denied: Only administrators can export inventory data.');
      return;
    }
    setShowExportModal(true);
  };

  const processExport = async (exportConfig: ExportConfig) => {
    try {
      setLoading(true);
      
      // Filter data based on export configuration
      let dataToExport = inventoryList;
      
      // Apply filters
      if (exportConfig.category !== 'All Categories') {
        dataToExport = dataToExport.filter(item => item.category === exportConfig.category);
      }
      
      if (exportConfig.status !== 'All Status') {
        dataToExport = dataToExport.filter(item => {
          const status = getStatus(item.quantity, item.threshold);
          return status === exportConfig.status;
        });
      }
      
      if (exportConfig.stockThreshold > 0) {
        dataToExport = dataToExport.filter(item => item.quantity <= exportConfig.stockThreshold);
      }

      // Validate data
      if (dataToExport.length === 0) {
        alert('No data matches your export criteria. Please adjust your filters.');
        setLoading(false);
        return;
      }

      // Generate report based on report type
      let headers: string[] = [];
      let reportData: (string | number)[][] = []; // Changed to support Excel format
      
      switch (exportConfig.reportType) {
        case 'summary':
          headers = ['Product Name', 'Category', 'Current Stock', 'Status', 'Total Value ($)'];
          reportData = dataToExport.map(item => [
            item.name || 'Unknown',
            item.category || 'Unknown',
            item.quantity,
            getStatus(item.quantity, item.threshold),
            parseFloat((item.quantity * (item.cost || 0)).toFixed(2))
          ]);
          break;
          
        case 'detailed':
          headers = ['Product ID', 'Product Name', 'Category', 'Current Stock', 'Threshold', 'Status', 'Last Restocked', 'Unit Cost ($)', 'Total Value ($)', 'Branch ID'];
          reportData = dataToExport.map(item => [
            item.productId,
            item.name || 'Unknown',
            item.category || 'Unknown',
            item.quantity,
            item.threshold || 30,
            getStatus(item.quantity, item.threshold),
            item.lastRestocked || 'Unknown',
            parseFloat((item.cost || 0).toFixed(2)),
            parseFloat((item.quantity * (item.cost || 0)).toFixed(2)),
            item.branchId
          ]);
          break;
          
        case 'lowstock':
          const lowStockData = dataToExport.filter(item => item.quantity <= (item.threshold || 30) && item.quantity > 0);
          headers = ['Product Name', 'Category', 'Current Stock', 'Threshold', 'Shortage', 'Reorder Priority'];
          reportData = lowStockData.map(item => [
            item.name || 'Unknown',
            item.category || 'Unknown',
            item.quantity,
            item.threshold || 30,
            (item.threshold || 30) - item.quantity,
            item.quantity <= 5 ? 'High' : item.quantity <= 15 ? 'Medium' : 'Low'
          ]);
          break;
          
        case 'outofstock':
          const outOfStockData = dataToExport.filter(item => item.quantity === 0);
          headers = ['Product Name', 'Category', 'Days Out of Stock', 'Last Restocked', 'Priority'];
          reportData = outOfStockData.map(item => {
            const daysOut = item.lastRestocked ? Math.floor((new Date().getTime() - new Date(item.lastRestocked).getTime()) / (1000 * 3600 * 24)) : 'Unknown';
            return [
              item.name || 'Unknown',
              item.category || 'Unknown',
              daysOut,
              item.lastRestocked || 'Unknown',
              daysOut === 'Unknown' || daysOut > 7 ? 'Critical' : 'High'
            ];
          });
          break;
      }

      // Create report metadata
      const reportMetadata = [
        [`Long Chau Pharmacy ${exportConfig.reportType.toUpperCase()} Report`],
        [`Generated on: ${new Date().toLocaleString()}`],
        [`Generated by: Manager`],
        [`Report Type: ${exportConfig.reportType}`],
        [`Date Range: ${exportConfig.dateFrom} to ${exportConfig.dateTo}`],
        [`Category Filter: ${exportConfig.category}`],
        [`Status Filter: ${exportConfig.status}`],
        [`Total Items: ${dataToExport.length}`],
        [`Export Format: ${exportConfig.format.toUpperCase()}`],
        [''], // Empty row
      ];

      if (exportConfig.format === 'xlsx') {
        // Generate Excel file
        try {
          await generateExcelFile(
            reportMetadata,
            headers,
            reportData,
            `${exportConfig.reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`
          );
        } catch (error) {
          console.error('Excel generation failed:', error);
          alert('Excel export failed. Falling back to CSV format.');
          // Fallback to CSV
          generateCSVFile(reportMetadata, headers, reportData, `${exportConfig.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
        }
      } else {
        // Generate CSV file
        generateCSVFile(reportMetadata, headers, reportData, `${exportConfig.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
      }
      
      alert(`${exportConfig.reportType.toUpperCase()} report exported successfully!\n\nReport Details:\n- Items: ${dataToExport.length}\n- Format: ${exportConfig.format.toUpperCase()}`);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again or contact IT support.');
    } finally {
      setLoading(false);
      setShowExportModal(false);
    }
  };

  const handleSyncInventory = async () => {
    try {
      setLoading(true);
      // Refetch data
      const [inventoryRes, productsRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/products')
      ]);

      if (inventoryRes.ok && productsRes.ok) {
        const [inventoryResult, productsResult] = await Promise.all([
          inventoryRes.json(),
          productsRes.json()
        ]);

        // Access the inventory array from the response object
        const inventoryData = inventoryResult.inventory || [];
        const productsData = productsResult.products || [];

        const enrichedInventory = inventoryData.map((item: any) => {
          const product = productsData.find((p: any) => p.productId === item.productId);
          return {
            ...item,
            name: product?.name || 'Unknown Product',
            category: product?.category || 'Unknown',
            cost: Number(product?.price || 0),
            threshold: item.threshold || 30,
            lastRestocked: item.lastRestocked || new Date().toISOString().split('T')[0]
          };
        });

        setInventoryList(enrichedInventory);
        setProducts(productsData);
        alert('Inventory synced successfully!');
      }
    } catch (err) {
      alert('Failed to sync inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = (item: Inventory) => {
    setSelectedItem(item);
    setModalType('restock');
    setShowModal(true);
  };

  const handleEdit = (item: Inventory) => {
    setSelectedItem(item);
    setModalType('edit');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleRestockSubmit = async (newQuantity: number) => {
    if (!selectedItem) return;

    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'restock',
          inventoryId: selectedItem.inventoryId,
          quantity: newQuantity
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to restock item');
      }

      // Update local state only after successful API call
      const updatedInventory = inventoryList.map(item => 
        item.inventoryId === selectedItem.inventoryId 
          ? { ...item, quantity: item.quantity + newQuantity, lastRestocked: new Date().toISOString().split('T')[0] }
          : item
      );
      setInventoryList(updatedInventory);
      
      alert(`Successfully restocked ${newQuantity} units of ${selectedItem.name}`);
      closeModal();
    } catch (error) {
      console.error('Error restocking item:', error);
      alert(`Failed to restock item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditSubmit = async (updatedItem: Inventory) => {
    if (!selectedItem) return;

    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'edit',
          inventoryId: selectedItem.inventoryId,
          quantity: updatedItem.quantity,
          threshold: updatedItem.threshold,
          cost: updatedItem.cost
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update item');
      }

      // Update local state only after successful API call
      const updatedInventory = inventoryList.map(item => 
        item.inventoryId === updatedItem.inventoryId ? updatedItem : item
      );
      setInventoryList(updatedInventory);
      
      alert('Item updated successfully!');
      closeModal();
    } catch (error) {
      console.error('Error updating item:', error);
      alert(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-700">Monitor stock levels and manage inventory</p>
        </div>
        <div className="flex gap-3">
          {/* Conditionally render Export button only for admin */}
          {user?.role === 'admin' && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          <button 
            onClick={handleSyncInventory}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Inventory
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 text-sm font-medium">Total Products</span>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
          <div className="text-xs text-gray-600 mt-1">Active inventory items</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 text-sm font-medium">Low Stock Alerts</span>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
          <div className="text-xs text-gray-600 mt-1">Items below threshold</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 text-sm font-medium">Out of Stock</span>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Minus className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          <div className="text-xs text-gray-600 mt-1">Items need restocking</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 text-sm font-medium">Total Value</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">$</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</div>
          <div className="text-xs text-gray-600 mt-1">Current inventory value</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
              />
            </div>
          </div>
          
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-700">Loading inventory data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 font-medium">Error loading data</div>
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

      {/* Inventory Table */}
      {!loading && !error && (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Product</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Category</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Current Stock</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Threshold</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Trend</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Last Restocked</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Cost</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map(item => {
                const status = getStatus(item.quantity, item.threshold);
                return (
                  <tr key={item.inventoryId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{item.quantity}</span>
                      {status === 'LOW STOCK' && (
                        <span className="ml-1 text-orange-500">⚠️</span>
                      )}
                      {status === 'OUT OF STOCK' && (
                        <span className="ml-1 text-red-500">⚠️</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.threshold} - 300</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getTrendIcon(item.quantity, item.threshold)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.lastRestocked}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">${(item.cost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRestock(item)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          Restock
                        </button>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && user?.role === 'admin' && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={processExport}
          categories={categories}
          inventoryList={inventoryList}
          getStatus={getStatus}
        />
      )}

      {/* Restock Modal */}
      {showModal && selectedItem && modalType === 'restock' && (
        <RestockModal 
          item={selectedItem} 
          onClose={closeModal} 
          onSubmit={handleRestockSubmit} 
        />
      )}

      {/* Edit Modal */}
      {showModal && selectedItem && modalType === 'edit' && (
        <EditInventoryModal 
          item={selectedItem} 
          onClose={closeModal} 
          onSubmit={handleEditSubmit} 
        />
      )}
    </main>
  );
}

function ExportModal({ 
  onClose, 
  onExport, 
  categories, 
  inventoryList,
  getStatus 
}: {
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  categories: (string | undefined)[]; // Fixed type to accept undefined values
  inventoryList: Inventory[];
  getStatus: (quantity: number, threshold?: number) => string;
}) {
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    reportType: 'detailed',
    format: 'csv',
    category: 'All Categories',
    status: 'All Status',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    stockThreshold: 0,
    includeMetadata: true
  });

  const handleExport = () => {
    if (!exportConfig.reportType || !exportConfig.format) {
      alert('Please select report type and format.');
      return;
    }
    onExport(exportConfig);
  };

  const getPreviewCount = () => {
    let count = inventoryList.length;
    if (exportConfig.category !== 'All Categories') {
      count = inventoryList.filter(item => item.category === exportConfig.category).length;
    }
    if (exportConfig.status !== 'All Status') {
      count = inventoryList.filter(item => getStatus(item.quantity, item.threshold) === exportConfig.status).length;
    }
    return count;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Export Inventory Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 bg-white space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-3">Report Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reportType"
                  value="summary"
                  checked={exportConfig.reportType === 'summary'}
                  onChange={(e) => setExportConfig({...exportConfig, reportType: e.target.value as 'summary'})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Summary Report</div>
                  <div className="text-sm text-gray-500">Basic inventory overview</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reportType"
                  value="detailed"
                  checked={exportConfig.reportType === 'detailed'}
                  onChange={(e) => setExportConfig({...exportConfig, reportType: e.target.value as 'detailed'})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Detailed Report</div>
                  <div className="text-sm text-gray-500">Complete inventory data</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reportType"
                  value="lowstock"
                  checked={exportConfig.reportType === 'lowstock'}
                  onChange={(e) => setExportConfig({...exportConfig, reportType: e.target.value as 'lowstock'})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Low Stock Report</div>
                  <div className="text-sm text-gray-500">Items below threshold</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reportType"
                  value="outofstock"
                  checked={exportConfig.reportType === 'outofstock'}
                  onChange={(e) => setExportConfig({...exportConfig, reportType: e.target.value as 'outofstock'})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Out of Stock Report</div>
                  <div className="text-sm text-gray-500">Items needing restocking</div>
                </div>
              </label>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Category Filter</label>
              <select
                value={exportConfig.category}
                onChange={(e) => setExportConfig({...exportConfig, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                {categories.map((category, index) => (
                  <option key={index} value={category || 'Unknown'}>{category || 'Unknown'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Status Filter</label>
              <select
                value={exportConfig.status}
                onChange={(e) => setExportConfig({...exportConfig, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="All Status">All Status</option>
                <option value="IN STOCK">In Stock</option>
                <option value="LOW STOCK">Low Stock</option>
                <option value="OUT OF STOCK">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">From Date</label>
              <input
                type="date"
                value={exportConfig.dateFrom}
                onChange={(e) => setExportConfig({...exportConfig, dateFrom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">To Date</label>
              <input
                type="date"
                value={exportConfig.dateTo}
                onChange={(e) => setExportConfig({...exportConfig, dateTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Export Format</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportConfig.format === 'csv'}
                  onChange={(e) => setExportConfig({...exportConfig, format: e.target.value as 'csv'})}
                  className="mr-2"
                />
                CSV (Recommended)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="xlsx"
                  checked={exportConfig.format === 'xlsx'}
                  onChange={(e) => setExportConfig({...exportConfig, format: e.target.value as 'xlsx'})}
                  className="mr-2"
                />
                Excel
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Export Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Report Type:</span>
                <span className="ml-2 font-medium">{exportConfig.reportType.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium">{exportConfig.format.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-600">Items to Export:</span>
                <span className="ml-2 font-medium">{getPreviewCount()}</span>
              </div>
              <div>
                <span className="text-gray-600">Date Range:</span>
                <span className="ml-2 font-medium">{exportConfig.dateFrom} to {exportConfig.dateTo}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Generate & Download Report
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// Restock Modal Component
function RestockModal({ item, onClose, onSubmit }: { 
  item: Inventory; 
  onClose: () => void; 
  onSubmit: (quantity: number) => void; 
}) {
  const [quantity, setQuantity] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0) {
      onSubmit(quantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-900">Restock Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 bg-white">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">Product</label>
            <p className="text-gray-900 font-medium">{item.name}</p>
            <p className="text-sm text-gray-600">Current Stock: {item.quantity} units</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Quantity to Add
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
              placeholder="Enter quantity"
              required
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Restock
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

// Edit Inventory Modal Component
function EditInventoryModal({ item, onClose, onSubmit }: { 
  item: Inventory; 
  onClose: () => void; 
  onSubmit: (item: Inventory) => void; 
}) {
  const [formData, setFormData] = useState({
    quantity: item.quantity || 0,
    threshold: item.threshold || 30,
    cost: item.cost || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...item,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-900">Edit Inventory Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Product</label>
            <p className="text-gray-900 font-medium">{item.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Current Stock</label>
            <input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Threshold</label>
            <input
              type="number"
              min="0"
              value={formData.threshold}
              onChange={(e) => setFormData({...formData, threshold: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Cost ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Update Item
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
const generateCSVFile = (metadata: (string | number)[][], headers: string[], data: (string | number)[][], filename: string) => {
  // Convert metadata to CSV format
  const metadataCSV = metadata.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  // Convert data to CSV format
  const headersCSV = headers.map(header => `"${header}"`).join(',');
  const dataCSV = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  const csvContent = metadataCSV + '\n' + headersCSV + '\n' + dataCSV;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
};

const generateExcelFile = async (metadata: (string | number)[][], headers: string[], data: (string | number)[][], filename: string) => {
  try {
    // Create a simple HTML table that Excel can interpret
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .metadata { font-weight: bold; color: #0066CC; }
            .header { font-weight: bold; background-color: #E0E0E0; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <table>
    `;

    // Add metadata rows
    metadata.forEach(row => {
      htmlContent += '<tr>';
      row.forEach(cell => {
        const cellValue = cell ? escapeHtml(cell.toString()) : '';
        htmlContent += `<td class="metadata">${cellValue}</td>`;
      });
      htmlContent += '</tr>';
    });

    // Add empty row
    htmlContent += '<tr><td colspan="10">&nbsp;</td></tr>';

    // Add header row
    htmlContent += '<tr>';
    headers.forEach(header => {
      htmlContent += `<th class="header">${escapeHtml(header)}</th>`;
    });
    htmlContent += '</tr>';

    // Add data rows
    data.forEach(row => {
      htmlContent += '<tr>';
      row.forEach(cell => {
        const cellValue = cell?.toString() || '';
        htmlContent += `<td>${escapeHtml(cellValue)}</td>`;
      });
      htmlContent += '</tr>';
    });

    htmlContent += `
          </table>
        </body>
      </html>
    `;

    // Create blob with correct MIME type for Excel
    const blob = new Blob([htmlContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    downloadFile(blob, filename.replace('.xlsx', '.xls'));
    
  } catch (error) {
    console.error('Excel generation failed:', error);
    throw error;
  }
};

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};