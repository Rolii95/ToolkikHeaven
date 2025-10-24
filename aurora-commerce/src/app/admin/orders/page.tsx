'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import AdminOrdersDashboard from '@/components/AdminOrdersDashboard';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  total_amount: number;
  status: string;
  priority_level: number;
  priority_score: number;
  fulfillment_priority: string;
  shipping_method: string;
  is_high_value: boolean;
  is_vip_customer: boolean;
  is_repeat_customer: boolean;
  priority_tags: string[];
  order_tags: string[];
  placed_at: string;
  estimated_ship_date?: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total_orders: number;
  urgent_orders: number;
  high_priority_orders: number;
  vip_orders: number;
  express_shipping_orders: number;
  avg_priority_score: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerTierFilter, setCustomerTierFilter] = useState<string>('all');
  const [shippingFilter, setShippingFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
    fetchStats();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [priorityFilter, statusFilter, customerTierFilter, shippingFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_email,
          total_amount,
          status,
          priority_level,
          priority_score,
          fulfillment_priority,
          shipping_method,
          is_high_value,
          is_vip_customer,
          is_repeat_customer,
          priority_tags,
          order_tags,
          placed_at,
          estimated_ship_date,
          created_at,
          updated_at
        `)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (priorityFilter !== 'all') {
        query = query.eq('priority_level', parseInt(priorityFilter));
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (customerTierFilter === 'vip') {
        query = query.eq('is_vip_customer', true);
      } else if (customerTierFilter === 'repeat') {
        query = query.eq('is_repeat_customer', true);
      }
      
      if (shippingFilter !== 'all') {
        if (shippingFilter === 'express') {
          query = query.in('shipping_method', ['express', 'overnight', 'priority']);
        } else {
          query = query.eq('shipping_method', shippingFilter);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders. Please check if the database schema is deployed.');
        return;
      }

      setOrders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to database. Please ensure the Order Prioritization Engine is deployed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Try to get stats using a simple aggregation if the RPC function doesn't exist yet
      const { data: statsData, error } = await supabase
        .from('orders')
        .select('priority_level, total_amount, is_vip_customer, shipping_method, priority_score');

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      if (statsData) {
        const stats = {
          total_orders: statsData.length,
          urgent_orders: statsData.filter(order => order.priority_level === 1).length,
          high_priority_orders: statsData.filter(order => order.priority_level === 2).length,
          vip_orders: statsData.filter(order => order.is_vip_customer).length,
          express_shipping_orders: statsData.filter(order => 
            ['express', 'overnight', 'priority'].includes(order.shipping_method)
          ).length,
          avg_priority_score: statsData.reduce((sum, order) => sum + (order.priority_score || 0), 0) / statsData.length
        };
        setStats(stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const updateOrderPriority = async (orderId: string, newPriority: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          priority_level: newPriority,
          manual_priority_override: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order priority:', error);
        return;
      }

      // Refresh orders
      await fetchOrders();
      await fetchStats();
    } catch (err) {
      console.error('Error updating priority:', err);
    }
  };

  const bulkUpdatePriority = async (orderIds: string[], newPriority: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          priority_level: newPriority,
          manual_priority_override: true,
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds);

      if (error) {
        console.error('Error bulk updating orders:', error);
        return;
      }

      // Refresh orders
      await fetchOrders();
      await fetchStats();
    } catch (err) {
      console.error('Error bulk updating:', err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Database Schema Not Deployed
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              Next Steps:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Open your Supabase dashboard</li>
              <li>2. Go to the SQL Editor</li>
              <li>3. Run the master-order-prioritization-setup.sql script</li>
              <li>4. Refresh this page</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order Prioritization Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and prioritize orders for optimal fulfillment
              </p>
            </div>
            <div className="flex space-x-3">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="1">🔴 Urgent (1)</option>
                <option value="2">🟠 High (2)</option>
                <option value="3">🟡 Normal (3)</option>
                <option value="4">🔵 Low (4)</option>
                <option value="5">⚪ Lowest (5)</option>
              </select>
              
              <select
                value={customerTierFilter}
                onChange={(e) => setCustomerTierFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Customers</option>
                <option value="vip">👑 VIP Customers</option>
                <option value="repeat">🔄 Repeat Customers</option>
              </select>
              
              <select
                value={shippingFilter}
                onChange={(e) => setShippingFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Shipping</option>
                <option value="express">⚡ Express/Priority</option>
                <option value="standard">📦 Standard</option>
                <option value="economy">🚛 Economy</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{stats.total_orders}</div>
              <div className="text-sm text-gray-500">Total Orders</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{stats.urgent_orders}</div>
              <div className="text-sm text-red-500">Urgent Orders</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{stats.high_priority_orders}</div>
              <div className="text-sm text-orange-500">High Priority</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.vip_orders}</div>
              <div className="text-sm text-purple-500">VIP Orders</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.express_shipping_orders}</div>
              <div className="text-sm text-blue-500">Express Shipping</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">
                {stats.avg_priority_score?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-green-500">Avg Priority Score</div>
            </div>
          </div>
        )}

        <AdminOrdersDashboard
          orders={orders}
          loading={loading}
          onUpdatePriority={updateOrderPriority}
          onBulkUpdatePriority={bulkUpdatePriority}
        />
      </div>
    </div>
  );
}