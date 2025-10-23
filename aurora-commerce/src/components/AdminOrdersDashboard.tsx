'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import OrderPrioritizationService, { OrderWithDetails } from '@/lib/order-prioritization';

interface DashboardSummary {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  urgent_orders: number;
  high_priority_orders: number;
  high_value_orders: number;
  express_orders: number;
  vip_orders: number;
  total_order_value: number;
  average_order_value: number;
}

interface OrderFilters {
  status: string[];
  priority_level: number[];
  shipping_method: string[];
  is_high_value?: boolean;
  is_vip_customer?: boolean;
  search: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

const AdminOrdersDashboard: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [itemsPerPage] = useState(20);

  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
    priority_level: [],
    shipping_method: [],
    search: '',
    sort_by: 'priority_level',
    sort_order: 'asc',
  });

  const supabase = createClientComponentClient();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load orders with filters
      const offset = (currentPage - 1) * itemsPerPage;
      const { orders: ordersData, total } = await OrderPrioritizationService.getOrdersForDashboard({
        ...filters,
        limit: itemsPerPage,
        offset: offset,
      });

      setOrders(ordersData);
      setTotalOrders(total);

      // Load summary statistics
      const summaryData = await OrderPrioritizationService.getDashboardSummary();
      setSummary(summaryData);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleFilterChange = (newFilters: Partial<OrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleOrderSelection = (orderId: string, selected: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (selected) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const result = await OrderPrioritizationService.updateOrderStatus(orderId, newStatus, 'admin');
      if (result.success) {
        await loadDashboardData(); // Refresh data
      } else {
        setError(result.error || 'Failed to update order status');
      }
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const handlePriorityUpdate = async (orderId: string, newPriority: number) => {
    try {
      const result = await OrderPrioritizationService.updateOrderPriority(orderId, newPriority, true);
      if (result.success) {
        await loadDashboardData(); // Refresh data
      } else {
        setError(result.error || 'Failed to update order priority');
      }
    } catch (err) {
      setError('Failed to update order priority');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.size === 0) return;

    try {
      setLoading(true);
      const orderIds = Array.from(selectedOrders);
      
      switch (action) {
        case 'mark_processing':
          for (const orderId of orderIds) {
            await OrderPrioritizationService.updateOrderStatus(orderId, 'processing', 'admin');
          }
          break;
        case 'mark_shipped':
          for (const orderId of orderIds) {
            await OrderPrioritizationService.updateOrderStatus(orderId, 'shipped', 'admin');
          }
          break;
        case 'recalculate_priority':
          await OrderPrioritizationService.recalculateAllPriorities();
          break;
      }

      setSelectedOrders(new Set());
      await loadDashboardData();
    } catch (err) {
      setError('Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 4: return 'bg-gray-100 text-gray-800 border-gray-200';
      case 5: return 'bg-gray-50 text-gray-600 border-gray-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-2">Prioritize and manage orders for optimal fulfillment</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleBulkAction('recalculate_priority')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalculate Priorities
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-gray-900">{summary.urgent_orders}</div>
            <div className="text-sm text-gray-500">Urgent Orders</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-gray-900">{summary.high_priority_orders}</div>
            <div className="text-sm text-gray-500">High Priority</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-gray-900">{summary.pending_orders}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-gray-900">{summary.processing_orders}</div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-gray-900">{summary.shipped_orders}</div>
            <div className="text-sm text-gray-500">Shipped</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_order_value)}</div>
            <div className="text-sm text-gray-500">Total Value</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Order number or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              multiple
              value={filters.status}
              onChange={(e) => handleFilterChange({ 
                status: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              multiple
              value={filters.priority_level.map(String)}
              onChange={(e) => handleFilterChange({ 
                priority_level: Array.from(e.target.selectedOptions, option => parseInt(option.value))
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">Urgent (1)</option>
              <option value="2">High (2)</option>
              <option value="3">Normal (3)</option>
              <option value="4">Low (4)</option>
              <option value="5">Lowest (5)</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={`${filters.sort_by}_${filters.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('_');
                handleFilterChange({ sort_by, sort_order: sort_order as 'asc' | 'desc' });
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="priority_level_asc">Priority (High to Low)</option>
              <option value="priority_level_desc">Priority (Low to High)</option>
              <option value="placed_at_desc">Date (Newest)</option>
              <option value="placed_at_asc">Date (Oldest)</option>
              <option value="total_amount_desc">Value (High to Low)</option>
              <option value="total_amount_asc">Value (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => handleFilterChange({ is_high_value: !filters.is_high_value })}
            className={`px-3 py-1 rounded-full text-sm border ${
              filters.is_high_value
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            High Value ($500+)
          </button>
          <button
            onClick={() => handleFilterChange({ is_vip_customer: !filters.is_vip_customer })}
            className={`px-3 py-1 rounded-full text-sm border ${
              filters.is_vip_customer
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            VIP Customers
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-blue-800">
            {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('mark_processing')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
            >
              Mark Processing
            </button>
            <button
              onClick={() => handleBulkAction('mark_shipped')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              Mark Shipped
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === orders.length && orders.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={(e) => handleOrderSelection(order.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.priority_tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer?.first_name} {order.customer?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{order.customer_email}</div>
                        {order.customer?.loyalty_tier && (
                          <div className="text-xs text-purple-600 capitalize">{order.customer.loyalty_tier}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.priority_level}
                        onChange={(e) => handlePriorityUpdate(order.id, parseInt(e.target.value))}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getPriorityColor(order.priority_level)}`}
                      >
                        <option value={1}>URGENT (1)</option>
                        <option value={2}>HIGH (2)</option>
                        <option value={3}>NORMAL (3)</option>
                        <option value={4}>LOW (4)</option>
                        <option value={5}>LOWEST (5)</option>
                      </select>
                      <div className="text-xs text-gray-500 mt-1">
                        Score: {order.priority_score.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </div>
                      {order.is_high_value && (
                        <div className="text-xs text-green-600">High Value</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{order.shipping_method}</div>
                      {order.is_express_shipping && (
                        <div className="text-xs text-orange-600">Express</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.placed_at)}</div>
                      <div className="text-xs text-gray-500">
                        {order.hours_since_placed.toFixed(1)}h ago
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-2">View</button>
                      <button className="text-green-600 hover:text-green-900">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalOrders)}
                  </span>{' '}
                  of <span className="font-medium">{totalOrders}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersDashboard;