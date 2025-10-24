'use client';

import React, { useState } from 'react';

interface Order {
  id: string;
  order_number?: string;
  customer_email?: string;
  total_amount: number;
  status: string;
  priority_level?: number;
  priority_score?: number;
  fulfillment_priority?: string;
  shipping_method?: string;
  is_high_value?: boolean;
  is_vip_customer?: boolean;
  is_repeat_customer?: boolean;
  priority_tags?: string[];
  order_tags?: string[];
  placed_at?: string;
  estimated_ship_date?: string;
  created_at: string;
  updated_at: string;
}

interface AdminOrdersDashboardProps {
  orders: Order[];
  loading: boolean;
  onUpdatePriority: (orderId: string, newPriority: number) => void;
  onBulkUpdatePriority: (orderIds: string[], newPriority: number) => void;
}

const AdminOrdersDashboard: React.FC<AdminOrdersDashboardProps> = ({
  orders,
  loading,
  onUpdatePriority,
  onBulkUpdatePriority
}) => {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 4: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 5: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: number): string => {
    switch (priority) {
      case 1: return '🔴 Urgent';
      case 2: return '🟠 High';
      case 3: return '🟡 Normal';
      case 4: return '🔵 Low';
      case 5: return '⚪ Lowest';
      default: return '❓ Unknown';
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    }
  };

  const handleBulkPriorityChange = (newPriority: number) => {
    if (selectedOrders.size > 0) {
      onBulkUpdatePriority(Array.from(selectedOrders), newPriority);
      setSelectedOrders(new Set());
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
        <p className="text-gray-500">
          No orders match your current filters, or the database schema hasn't been deployed yet.
        </p>
        <div className="mt-4 text-sm text-gray-400">
          If this is a new installation, please ensure you've run the database setup script.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <span className="text-sm text-blue-700">Set Priority:</span>
              {[1, 2, 3, 4, 5].map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleBulkPriorityChange(priority)}
                  className={`px-2 py-1 text-xs rounded border ${getPriorityColor(priority)} hover:opacity-80`}
                >
                  {getPriorityLabel(priority)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrders.size === orders.length && orders.length > 0}
                  onChange={handleSelectAll}
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
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipping
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.order_number || `#${order.id.slice(0, 8)}`}
                    </div>
                    {order.priority_score && (
                      <div className="text-xs text-gray-500">
                        Score: {order.priority_score.toFixed(1)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      {order.customer_email || 'No email'}
                    </div>
                    <div className="flex space-x-1 mt-1">
                      {order.is_vip_customer && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          👑 VIP
                        </span>
                      )}
                      {order.is_repeat_customer && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          🔄 Repeat
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatAmount(order.total_amount)}
                    </div>
                    {order.is_high_value && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        💰 High Value
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(order.priority_level || 3)}`}>
                    {getPriorityLabel(order.priority_level || 3)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'shipped' ? 'bg-green-100 text-green-800' :
                    order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {order.shipping_method || 'standard'}
                  </div>
                  {(order.shipping_method === 'express' || order.shipping_method === 'overnight') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      ⚡ Express
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {order.priority_tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => onUpdatePriority(order.id, priority)}
                        className={`px-1 py-0.5 text-xs rounded border hover:opacity-80 ${
                          order.priority_level === priority 
                            ? getPriorityColor(priority) 
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}
                        title={`Set priority to ${getPriorityLabel(priority)}`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or check that orders exist in the database.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersDashboard;