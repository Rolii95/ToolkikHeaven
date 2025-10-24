'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface InventoryItem {
  id: string;
  sku: string;
  product_name: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  reorder_point: number;
  warehouse_location: string;
  supplier_name: string;
  lead_time_days: number;
  stock_status: 'normal' | 'low' | 'critical' | 'out_of_stock';
  last_sale_date: string | null;
  last_restock_date: string | null;
  cost_price: number;
}

interface DashboardSummary {
  total_products: number;
  products_in_stock: number;
  products_low_stock: number;
  products_out_of_stock: number;
  total_inventory_value: number;
  active_products_30d: number;
}

interface StockMovement {
  id: string;
  created_at: string;
  sku: string;
  product_name: string;
  movement_type: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reference_type: string;
  reference_id: string;
  notes: string;
  warehouse_location: string;
}

const AdvancedInventoryDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'critical' | 'out_of_stock'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovements, setShowMovements] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchInventoryData();
    fetchDashboardSummary();
    fetchStockMovements();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('low_stock_summary')
        .select('*')
        .order('available_stock', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchDashboardSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_dashboard_summary')
        .select('*')
        .single();

      if (error) throw error;
      setSummary(data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movement_history')
        .select('*')
        .limit(50);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    }
  };

  const updateStock = async (inventoryId: string, quantityChange: number, movementType: string, notes: string) => {
    try {
      const { error } = await supabase.rpc('update_inventory_stock', {
        p_inventory_id: inventoryId,
        p_quantity_change: quantityChange,
        p_movement_type: movementType,
        p_reference_type: 'manual_adjustment',
        p_notes: notes
      });

      if (error) throw error;
      
      // Refresh data
      await fetchInventoryData();
      await fetchDashboardSummary();
      await fetchStockMovements();
      
      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      normal: { className: 'bg-green-100 text-green-800', label: '✅ In Stock' },
      low: { className: 'bg-yellow-100 text-yellow-800', label: '⚠️ Low Stock' },
      critical: { className: 'bg-orange-100 text-orange-800', label: '🔥 Critical' },
      out_of_stock: { className: 'bg-red-100 text-red-800 animate-pulse', label: '🚨 Out of Stock' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.normal;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getMovementIcon = (type: string) => {
    const icons = {
      purchase: '📦',
      sale: '🛒',
      adjustment: '⚙️',
      return: '↩️',
      transfer: '🔄',
      reservation: '🔒',
      release: '🔓'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const filteredInventory = inventory.filter(item => {
    const matchesFilter = filter === 'all' || item.stock_status === filter;
    const matchesSearch = item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📦 Advanced Inventory Management</h1>
          <p className="text-gray-600 mt-2">Real-time stock tracking, movement history, and warehouse management</p>
        </div>

        {/* Dashboard Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{summary.total_products}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{summary.products_in_stock}</div>
              <div className="text-sm text-gray-600">In Stock</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">{summary.products_low_stock}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-red-600">{summary.products_out_of_stock}</div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">
                ${summary.total_inventory_value?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Inventory Value</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-indigo-600">{summary.active_products_30d}</div>
              <div className="text-sm text-gray-600">Active (30d)</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by SKU or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'low', 'critical', 'out_of_stock'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption === 'all' ? 'All' : filterOption.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMovements(!showMovements)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {showMovements ? 'Hide' : 'Show'} Movements
            </button>
          </div>
        </div>

        {/* Stock Movements Panel */}
        {showMovements && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">📋 Recent Stock Movements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.slice(0, 10).map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{movement.product_name}</div>
                        <div className="text-sm text-gray-500">{movement.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getMovementIcon(movement.movement_type)} {movement.movement_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.previous_stock} → {movement.new_stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {movement.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">📊 Inventory Status</h2>
            <p className="text-gray-600">Showing {filteredInventory.length} products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Levels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                      <div className="text-xs text-gray-400">{item.warehouse_location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Current: <span className="font-medium">{item.current_stock}</span></div>
                        <div>Reserved: <span className="text-orange-600">{item.reserved_stock}</span></div>
                        <div>Available: <span className="font-bold text-green-600">{item.available_stock}</span></div>
                        <div className="text-xs text-gray-500">Reorder at: {item.reorder_point}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.stock_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.supplier_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Lead time: {item.lead_time_days}d</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Sale: {item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString() : 'Never'}</div>
                      <div>Restock: {item.last_restock_date ? new Date(item.last_restock_date).toLocaleDateString() : 'Never'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const quantity = prompt('Enter quantity to add:');
                            if (quantity && !isNaN(Number(quantity))) {
                              updateStock(item.id, Number(quantity), 'purchase', 'Manual stock increase');
                            }
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          ➕ Add
                        </button>
                        <button
                          onClick={() => {
                            const quantity = prompt('Enter quantity to remove:');
                            if (quantity && !isNaN(Number(quantity))) {
                              updateStock(item.id, -Number(quantity), 'adjustment', 'Manual stock decrease');
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          ➖ Remove
                        </button>
                        <button
                          onClick={() => {
                            const quantity = prompt('Enter new reorder point:');
                            if (quantity && !isNaN(Number(quantity))) {
                              // This would need a separate function to update reorder points
                              alert('Reorder point update feature coming soon!');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ⚙️ Configure
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedInventoryDashboard;