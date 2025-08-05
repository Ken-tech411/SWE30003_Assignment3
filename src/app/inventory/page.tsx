'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Search, Download, RefreshCw, TrendingUp, TrendingDown, Minus, Edit, Package, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Footer } from '@/components/footer';

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
  branchLocation?: string;
  managerName?: string;
  contactNumber?: string;
}


interface Branch {
  branchId: number;
  location: string;
  managerName: string;
  contactNumber: string;
}

interface ExportConfig {
  reportType: 'summary' | 'detailed' | 'lowstock' | 'outofstock';
  format: 'csv' | 'xlsx';
  category: string;
  status: string;
  branch: string;
  dateFrom: string;
  dateTo: string;
  stockThreshold: number;
  includeMetadata: boolean;
}

// Utility functions for status calculation
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

// Export utility functions
const generateCSVFile = (metadata: (string | number)[][], headers: string[], data: (string | number)[][], filename: string) => {
  const metadataCSV = metadata.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const headersCSV = headers.map(header => `"${header}"`).join(',');
  const dataCSV = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  const csvContent = metadataCSV + '\n' + headersCSV + '\n' + dataCSV;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
};

const generateExcelFile = async (metadata: (string | number)[][], headers: string[], data: (string | number)[][], filename: string) => {
  try {
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

    metadata.forEach(row => {
      htmlContent += '<tr>';
      row.forEach(cell => {
        const cellValue = cell ? escapeHtml(cell.toString()) : '';
        htmlContent += `<td class="metadata">${cellValue}</td>`;
      });
      htmlContent += '</tr>';
    });

    htmlContent += '<tr><td colspan="10">&nbsp;</td></tr>';

    htmlContent += '<tr>';
    headers.forEach(header => {
      htmlContent += `<th class="header">${escapeHtml(header)}</th>`;
    });
    htmlContent += '</tr>';

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

// Memoized Stats Card Component
const StatsCard = memo(({ title, value, icon, subtitle, colorClass }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle: string;
  colorClass: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-700 text-sm font-medium">{title}</span>
      <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className={`text-2xl font-bold ${
      title.includes('Low Stock') ? 'text-orange-600' : 
      title.includes('Out of Stock') ? 'text-red-600' : 
      title.includes('Total Value') ? 'text-green-600' : 'text-gray-900'
    }`}>
      {title.includes('Total Value') ? `$${value.toFixed(2)}` : value}
    </div>
    <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
  </div>
));

// Memoized Inventory Row Component with improved spacing
const InventoryRow = memo(({ item, onRestock, onEdit }: {
  item: Inventory;
  onRestock: (item: Inventory) => void;
  onEdit: (item: Inventory) => void;
}) => {
  const status = useMemo(() => getStatus(item.quantity, item.threshold), [item.quantity, item.threshold]);
  const statusColor = useMemo(() => getStatusColor(status), [status]);
  const trendIcon = useMemo(() => getTrendIcon(item.quantity, item.threshold), [item.quantity, item.threshold]);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-6 w-1/5">
        <div className="font-medium text-gray-900 text-sm leading-relaxed">{item.name}</div>
        <div className="text-xs text-gray-500 mt-1">ID: {item.productId}</div>
      </td>
      <td className="px-6 py-6 w-1/8">
        <div className="font-medium text-gray-900 text-sm">{item.branchLocation}</div>
        <div className="text-xs text-gray-500 mt-1">Branch {item.branchId}</div>
      </td>
      <td className="px-6 py-6 w-1/10">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {item.category}
        </span>
      </td>
      <td className="px-6 py-6 w-1/12 text-center">
        <div className="flex items-center justify-center space-x-2">
          <span className="font-bold text-gray-900 text-lg">{item.quantity}</span>
          {status === 'LOW STOCK' && (
            <span className="text-orange-500 text-lg">⚠️</span>
          )}
          {status === 'OUT OF STOCK' && (
            <span className="text-red-500 text-lg">⚠️</span>
          )}
        </div>
      </td>
      <td className="px-6 py-6 w-1/12 text-center">
        <span className="text-gray-700 text-sm font-medium">{item.threshold || 30}</span>
      </td>
      <td className="px-6 py-6 w-1/10 text-center">
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-6 w-1/12 text-center">
        <div className="flex justify-center">
          {trendIcon}
        </div>
      </td>
      <td className="px-6 py-6 w-1/10 text-center">
        <span className="text-gray-700 text-sm">{item.lastRestocked}</span>
      </td>
      <td className="px-6 py-6 w-1/12 text-center">
        <span className="font-bold text-gray-900 text-sm">${(item.cost || 0).toFixed(2)}</span>
      </td>
      <td className="px-6 py-6 w-1/8">
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => onRestock(item)}
            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Restock
          </button>
          <button 
            onClick={() => onEdit(item)}
            className="px-3 py-2 text-xs bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center gap-1 font-medium"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
});

// Main Inventory Page Component
export default function ImprovedInventoryPage() {
  const { user } = useAuth();
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'restock' | 'edit'>('view');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Optimized data fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build inventory URL with branch filter
      let inventoryUrl = '/api/inventory';
      if (branchFilter !== 'All Branches') {
        inventoryUrl += `?branchId=${branchFilter}`;
      }

      const [inventoryRes, productsRes, branchesRes] = await Promise.all([
        fetch(inventoryUrl),
        fetch('/api/products'),
        fetch('/api/branches').catch(() => ({ ok: false, json: () => ({ branches: [] }) }))
      ]);

      if (!inventoryRes.ok) {
        throw new Error(`Failed to fetch inventory: ${inventoryRes.status}`);
      }
      if (!productsRes.ok) {
        throw new Error(`Failed to fetch products: ${productsRes.status}`);
      }

      const [inventoryResult, productsResult, branchesResult] = await Promise.all([
        inventoryRes.json(),
        productsRes.json(),
        branchesRes.ok ? branchesRes.json() : { branches: [] }
      ]);

      const inventoryData = inventoryResult.inventory || [];
      const productsData = productsResult.products || [];
      const branchesData = branchesResult.branches || [];

      // The inventory data now comes with branch information already joined
      const enrichedInventory = inventoryData.map((item: Record<string, unknown>) => {
        const product = productsData.find((p: Record<string, unknown>) => p.productId === item.productId);
        return {
          ...item,
          name: item.name || product?.name || 'Unknown Product',
          category: item.category || product?.category || 'Unknown',
          cost: Number(item.price || product?.price || 0),
          quantity: item.quantity || 0,
          threshold: item.threshold || 30,
          lastRestocked: typeof item.updatedAt === 'string' || typeof item.updatedAt === 'number' ? new Date(item.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          branchLocation: item.branchLocation || `Branch ${item.branchId}`,
          managerName: item.managerName || 'Unknown Manager',
          contactNumber: item.contactNumber || 'N/A'
        };
      });

      setInventoryList(enrichedInventory);
      setBranches(branchesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [branchFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized calculations for performance with pagination
  const { filteredInventory, totalProducts, lowStockItems, outOfStockItems, totalValue, categories, currentItems, totalPages } = useMemo(() => {
    const filtered = inventoryList.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.branchLocation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
      const status = getStatus(item.quantity, item.threshold);
      const matchesStatus = statusFilter === 'All Status' || status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filtered.slice(startIndex, endIndex);

    const total = inventoryList.length;
    const lowStock = inventoryList.filter(item => item.quantity > 0 && item.quantity <= (item.threshold || 30)).length;
    const outOfStock = inventoryList.filter(item => item.quantity === 0).length;
    const value = inventoryList.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0);
    const cats = ['All Categories', ...Array.from(new Set(inventoryList.map(item => item.category).filter(Boolean)))];

    return {
      filteredInventory: filtered,
      currentItems,
      totalPages,
      totalProducts: total,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
      totalValue: value,
      categories: cats
    };
  }, [inventoryList, searchTerm, categoryFilter, statusFilter, currentPage, itemsPerPage]);

  // Event handlers with useCallback
  const handleExport = useCallback(() => {
    if (user?.role !== 'admin') {
      alert('Access Denied: Only administrators can export inventory data.');
      return;
    }
    setShowExportModal(true);
  }, [user?.role]);

  const handleSyncInventory = useCallback(async () => {
    await fetchData();
    alert('Inventory synced successfully!');
  }, [fetchData]);

  const handleRestock = useCallback((item: Inventory) => {
    setSelectedItem(item);
    setModalType('restock');
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((item: Inventory) => {
    setSelectedItem(item);
    setModalType('edit');
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedItem(null);
  }, []);

  const handleRestockSubmit = useCallback(async (newQuantity: number) => {
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

      setInventoryList(prev => prev.map(item => 
        item.inventoryId === selectedItem.inventoryId 
          ? { ...item, quantity: item.quantity + newQuantity, lastRestocked: new Date().toISOString().split('T')[0] }
          : item
      ));
      
      alert(`Successfully restocked ${newQuantity} units of ${selectedItem.name}`);
      closeModal();
    } catch (error) {
      console.error('Error restocking item:', error);
      alert(`Failed to restock item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedItem, closeModal]);

  const handleEditSubmit = useCallback(async (updatedItem: Inventory) => {
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

      setInventoryList(prev => prev.map(item => 
        item.inventoryId === updatedItem.inventoryId ? updatedItem : item
      ));
      
      alert('Item updated successfully!');
      closeModal();
    } catch (error) {
      console.error('Error updating item:', error);
      alert(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedItem, closeModal]);

  // Complete export processing
  const processExport = useCallback(async (exportConfig: ExportConfig) => {
  try {
    setLoading(true);
    
    let dataToExport = inventoryList;
    console.log('Starting export with data:', dataToExport.length, 'items');
    console.log('Export config:', exportConfig);
    
    // Apply branch filter FIRST - this is crucial
    if (exportConfig.branch !== 'All Branches') {
      console.log('Filtering by branch:', exportConfig.branch);
      console.log('Available branch IDs:', Array.from(new Set(dataToExport.map(item => item.branchId))));
      
      dataToExport = dataToExport.filter(item => {
        // Ensure both are strings for comparison
        const itemBranchId = item.branchId?.toString();
        const selectedBranchId = exportConfig.branch.toString();
        
        console.log(`Comparing: item.branchId="${itemBranchId}" with selected="${selectedBranchId}"`);
        return itemBranchId === selectedBranchId;
      });
      
      console.log('After branch filter:', dataToExport.length, 'items');
    }
    
    // Apply category filter
    if (exportConfig.category !== 'All Categories') {
      console.log('Filtering by category:', exportConfig.category);
      dataToExport = dataToExport.filter(item => item.category === exportConfig.category);
      console.log('After category filter:', dataToExport.length, 'items');
    }
    
    // Apply status filter
    if (exportConfig.status !== 'All Status') {
      console.log('Filtering by status:', exportConfig.status);
      dataToExport = dataToExport.filter(item => {
        const status = getStatus(item.quantity, item.threshold);
        return status === exportConfig.status;
      });
      console.log('After status filter:', dataToExport.length, 'items');
    }
    
    // Apply stock threshold filter
    if (exportConfig.stockThreshold > 0) {
      console.log('Filtering by stock threshold:', exportConfig.stockThreshold);
      dataToExport = dataToExport.filter(item => item.quantity <= exportConfig.stockThreshold);
      console.log('After threshold filter:', dataToExport.length, 'items');
    }

    if (dataToExport.length === 0) {
      alert('No data matches your export criteria. Please adjust your filters.');
      setLoading(false);
      return;
    }

    // Get branch information for the report
    const selectedBranch = branches.find(b => b.branchId.toString() === exportConfig.branch.toString());
    const branchName = exportConfig.branch === 'All Branches' 
      ? 'All Branches' 
      : (selectedBranch?.location || `Branch ${exportConfig.branch}`);

    let headers: string[] = [];
    let reportData: (string | number)[][] = [];
    
    switch (exportConfig.reportType) {
      case 'summary':
        headers = ['Product Name', 'Category', 'Branch Location', 'Current Stock', 'Status', 'Total Value ($)'];
        reportData = dataToExport.map(item => [
          item.name || 'Unknown',
          item.category || 'Unknown',
          item.branchLocation || branches.find(b => b.branchId.toString() === item.branchId?.toString())?.location || item.branchId,
          item.quantity,
          getStatus(item.quantity, item.threshold),
          parseFloat((item.quantity * (item.cost || 0)).toFixed(2))
        ]);
        break;
        
      case 'detailed':
        headers = ['Product ID', 'Product Name', 'Category', 'Branch ID', 'Branch Location', 'Current Stock', 'Threshold', 'Status', 'Last Updated', 'Unit Cost ($)', 'Total Value ($)'];
        reportData = dataToExport.map(item => [
          item.productId,
          item.name || 'Unknown',
          item.category || 'Unknown',
          item.branchId,
          item.branchLocation || branches.find(b => b.branchId.toString() === item.branchId?.toString())?.location || item.branchId,
          item.quantity,
          item.threshold || 30,
          getStatus(item.quantity, item.threshold),
          item.lastRestocked || 'Unknown',
          parseFloat((item.cost || 0).toFixed(2)),
          parseFloat((item.quantity * (item.cost || 0)).toFixed(2))
        ]);
        break;
        
      case 'lowstock':
        const lowStockData = dataToExport.filter(item => item.quantity <= (item.threshold || 30) && item.quantity > 0);
        headers = ['Product Name', 'Category', 'Branch Location', 'Current Stock', 'Threshold', 'Shortage', 'Reorder Priority'];
        reportData = lowStockData.map(item => [
          item.name || 'Unknown',
          item.category || 'Unknown',
          item.branchLocation || branches.find(b => b.branchId.toString() === item.branchId?.toString())?.location || item.branchId,
          item.quantity,
          item.threshold || 30,
          (item.threshold || 30) - item.quantity,
          item.quantity <= 5 ? 'High' : item.quantity <= 15 ? 'Medium' : 'Low'
        ]);
        break;
        
      case 'outofstock':
        const outOfStockData = dataToExport.filter(item => item.quantity === 0);
        headers = ['Product Name', 'Category', 'Branch Location', 'Days Out of Stock', 'Last Updated', 'Priority'];
        reportData = outOfStockData.map(item => {
          const daysOut = item.lastRestocked ? Math.floor((new Date().getTime() - new Date(item.lastRestocked).getTime()) / (1000 * 3600 * 24)) : 'Unknown';
          return [
            item.name || 'Unknown',
            item.category || 'Unknown',
            item.branchLocation || branches.find(b => b.branchId.toString() === item.branchId?.toString())?.location || item.branchId,
            daysOut,
            item.lastRestocked || 'Unknown',
            daysOut === 'Unknown' || daysOut > 7 ? 'Critical' : 'High'
          ];
        });
        break;
    }

    // Create comprehensive report metadata
    const reportMetadata = [
      [`Long Chau Pharmacy ${exportConfig.reportType.toUpperCase()} Report`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [`Generated by: ${user?.name || user?.username || 'Admin'}`],
      [`Report Type: ${exportConfig.reportType}`],
      [`Branch: ${branchName}`],
      [`Category Filter: ${exportConfig.category}`],
      [`Status Filter: ${exportConfig.status}`],
      [`Date Range: ${exportConfig.dateFrom} to ${exportConfig.dateTo}`],
      [`Total Items: ${dataToExport.length}`],
      [`Export Format: ${exportConfig.format.toUpperCase()}`],
      [`Timestamp: ${new Date().toISOString()}`],
      [''], // Empty row separator
    ];

    // Generate filename with branch and timestamp
    const sanitizedBranchName = branchName.replace(/[^a-zA-Z0-9]/g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `LC-PMS-${exportConfig.reportType}-${sanitizedBranchName}-${timestamp}`;

    console.log('Generating file:', filename);
    console.log('Report data rows:', reportData.length);

    // Generate the file
    if (exportConfig.format === 'xlsx') {
      try {
        await generateExcelFile(
          reportMetadata,
          headers,
          reportData,
          `${filename}.xlsx`
        );
      } catch (error) {
        console.error('Excel generation failed:', error);
        alert('Excel export failed. Falling back to CSV format.');
        generateCSVFile(reportMetadata, headers, reportData, `${filename}.csv`);
      }
    } else {
      generateCSVFile(reportMetadata, headers, reportData, `${filename}.csv`);
    }
    
    // Success message with details
    alert(`✅ Export Successful!\n\n` +
          `Report: ${exportConfig.reportType.toUpperCase()}\n` +
          `Branch: ${branchName}\n` +
          `Items: ${dataToExport.length}\n` +
          `Format: ${exportConfig.format.toUpperCase()}\n\n` +
          `File: ${filename}.${exportConfig.format}`);
    
  } catch (error) {
    console.error('Export failed:', error);
    alert('❌ Export failed. Please try again or contact IT support.\n\nError: ' + (error as Error).message);
  } finally {
    setLoading(false);
    setShowExportModal(false);
  }
}, [inventoryList, branches, user]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, branchFilter]);

  // Authentication checks
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
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1 justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please sign in to access the inventory management system.</p>
            <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">
              Go to Login
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user.role || (user.role !== 'pharmacist' && user.role !== 'admin')) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1 justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only pharmacists and administrators can access the inventory management system.
            </p>
            <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
              Return to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="p-6 bg-gray-50 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-700 text-lg">Monitor stock levels and manage inventory across all branches</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'admin' && (
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            )}
            <button 
              onClick={handleSyncInventory}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Inventory
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Products"
            value={totalProducts}
            icon={<div className="w-4 h-4 bg-blue-500 rounded"></div>}
            subtitle="Active inventory items"
            colorClass="bg-blue-100"
          />
          <StatsCard
            title="Low Stock Alerts"
            value={lowStockItems}
            icon={<TrendingDown className="w-4 h-4 text-orange-500" />}
            subtitle="Items below threshold"
            colorClass="bg-orange-100"
          />
          <StatsCard
            title="Out of Stock"
            value={outOfStockItems}
            icon={<Minus className="w-4 h-4 text-red-500" />}
            subtitle="Items need restocking"
            colorClass="bg-red-100"
          />
          <StatsCard
            title="Total Value"
            value={totalValue}
            icon={<span className="text-green-600 font-bold text-sm">$</span>}
            subtitle="Current inventory value"
            colorClass="bg-green-100"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-80">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products, categories, or branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900 text-sm"
                />
              </div>
            </div>
            
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-44 text-gray-900 text-sm"
            >
              <option value="All Branches">All Branches</option>
              {branches.map(branch => (
                <option key={branch.branchId} value={branch.branchId.toString()}>
                  {branch.location}
                </option>
              ))}
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-44 text-gray-900 text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-36 text-gray-900 text-sm"
            >
              <option value="All Status">All Status</option>
              <option value="IN STOCK">In Stock</option>
              <option value="LOW STOCK">Low Stock</option>
              <option value="OUT OF STOCK">Out of Stock</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white min-w-20 text-gray-900 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-4 text-gray-700 text-lg">Loading inventory data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 font-medium text-lg">Error loading data</div>
            </div>
            <div className="text-red-600 text-sm mt-2">{error}</div>
            <button 
              onClick={fetchData} 
              className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Inventory Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Table Header with Results Count */}
            <div className="px-6 py-5 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Inventory Items ({filteredInventory.length} total)
                </h3>
                <div className="text-sm text-gray-600 font-medium">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredInventory.length)} - {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/5">Product</th>
                    <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/8">Branch</th>
                    <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/10">Category</th>
                    <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/12">Current Stock</th>
                    <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/12">Threshold</th>
                    <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/10">Status</th>
                    <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/12">Trend</th>
                    <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/10">Last Updated</th>
                    <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/12">Cost</th>
                    <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase tracking-wider w-1/8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentItems.map(item => (
                    <InventoryRow
                      key={item.inventoryId}
                      item={item}
                      onRestock={handleRestock}
                      onEdit={handleEdit}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-5 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 font-medium">
                    Page {currentPage} of {totalPages} ({filteredInventory.length} total results)
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      First
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`px-4 py-2 text-sm border rounded-md font-medium transition-colors ${
                              currentPage === pageNumber
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Next
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredInventory.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">No inventory items found</h3>
            <p className="text-gray-600 text-lg">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && user?.role === 'admin' && (
          <ExportModal
            onClose={() => setShowExportModal(false)}
            onExport={processExport}
            categories={categories.filter((c): c is string => typeof c === 'string')}
            inventoryList={inventoryList}
            branches={branches}
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
      <Footer />
    </div>
  );
}

// Restock Modal Component
const RestockModal = memo(({ item, onClose, onSubmit }: { 
  item: Inventory; 
  onClose: () => void; 
  onSubmit: (quantity: number) => void; 
}) => {
  const [quantity, setQuantity] = useState<number>(0);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0) {
      onSubmit(quantity);
    }
  }, [quantity, onSubmit]);

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
});

// Edit Inventory Modal Component
const EditInventoryModal = memo(({ item, onClose, onSubmit }: { 
  item: Inventory; 
  onClose: () => void; 
  onSubmit: (item: Inventory) => void; 
}) => {
  const [formData, setFormData] = useState({
    quantity: item.quantity || 0,
    threshold: item.threshold || 30,
    cost: item.cost || 0
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...item,
      ...formData
    });
  }, [item, formData, onSubmit]);

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
});

const ExportModal = memo(({ 
  onClose, 
  onExport, 
  categories, 
  inventoryList,
  branches
}: {
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  categories: string[];
  inventoryList: Inventory[];
  branches: Branch[];
}) => {
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    reportType: 'detailed',
    format: 'csv',
    category: 'All Categories',
    status: 'All Status',
    branch: 'All Branches',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    stockThreshold: 0,
    includeMetadata: true
  });

  // Debug: Log current state
  console.log('Export Config:', exportConfig);
  console.log('Inventory List:', inventoryList);
  console.log('Branches:', branches);

  const handleExport = () => {
    if (!exportConfig.reportType || !exportConfig.format) {
      alert('Please select report type and format.');
      return;
    }
    
    // Debug: Check what we're about to export
    const previewCount = getPreviewCount();
    console.log('Items to export:', previewCount);
    
    if (previewCount === 0) {
      alert('No data matches your export criteria. Please adjust your filters.');
      return;
    }
    
    onExport(exportConfig);
  };

  const getPreviewCount = () => {
    let filteredData = inventoryList;
    
    console.log('Starting filter with items:', filteredData.length);
    
    // Apply branch filter - This is the key fix!
    if (exportConfig.branch !== 'All Branches') {
      console.log('Filtering by branch:', exportConfig.branch);
      // Convert to string for comparison since branchId might be number or string
      filteredData = filteredData.filter(item => {
        const itemBranchId = item.branchId?.toString();
        const selectedBranchId = exportConfig.branch.toString();
        console.log(`Comparing item.branchId: ${itemBranchId} with selected: ${selectedBranchId}`);
        return itemBranchId === selectedBranchId;
      });
      console.log('After branch filter:', filteredData.length);
    }
    
    // Apply category filter
    if (exportConfig.category !== 'All Categories') {
      console.log('Filtering by category:', exportConfig.category);
      filteredData = filteredData.filter(item => item.category === exportConfig.category);
      console.log('After category filter:', filteredData.length);
    }
    
    // Apply status filter
    if (exportConfig.status !== 'All Status') {
      console.log('Filtering by status:', exportConfig.status);
      filteredData = filteredData.filter(item => {
        const status = getStatus(item.quantity, item.threshold);
        return status === exportConfig.status;
      });
      console.log('After status filter:', filteredData.length);
    }
    
    return filteredData.length;
  };

  const getStatus = (quantity: number, threshold: number = 30): string => {
    if (quantity === 0) return 'OUT OF STOCK';
    if (quantity <= threshold) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const getSelectedBranchName = () => {
    if (exportConfig.branch === 'All Branches') return 'All Branches';
    const branch = branches.find(b => b.branchId.toString() === exportConfig.branch.toString());
    return branch?.location || `Branch ${exportConfig.branch}`;
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Branch Filter</label>
              <select
                value={exportConfig.branch}
                onChange={(e) => {
                  console.log('Branch changed to:', e.target.value);
                  setExportConfig({...exportConfig, branch: e.target.value});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="All Branches">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId.toString()}>
                    {branch.location} (ID: {branch.branchId})
                  </option>
                ))}
              </select>
            </div>

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

          {/* Enhanced Preview */}
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
                <span className="text-gray-600">Branch:</span>
                <span className="ml-2 font-medium">{getSelectedBranchName()}</span>
              </div>
              <div>
                <span className="text-gray-600">Items to Export:</span>
                <span className={`ml-2 font-medium ${getPreviewCount() === 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getPreviewCount()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{exportConfig.category}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{exportConfig.status}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleExport}
              disabled={getPreviewCount() === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                getPreviewCount() === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
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
});

ExportModal.displayName = 'ExportModal';
StatsCard.displayName = 'StatsCard';
InventoryRow.displayName = 'InventoryRow';
RestockModal.displayName = 'RestockModal';
EditInventoryModal.displayName = 'EditInventoryModal';
