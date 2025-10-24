'use client'

import React, { useState, useEffect } from 'react'

interface DashboardData {
  summary: {
    totalRevenue: string
    totalCustomers: number
    totalOrders: number
    avgOrderValue: string
    period: string
  }
  customerAnalytics: Array<{
    customer_email: string
    total_orders: number
    lifetime_value: string
    avg_order_value: string
    checkout_conversion_rate: number
  }>
  dailyAnalytics: Array<{
    date: string
    total_events: number
    unique_customers: number
    unique_sessions: number
    page_views: number
    purchases: number
    revenue: string
  }>
  productAnalytics: Array<{
    product_id: string
    views: number
    add_to_carts: number
    purchases: number
    revenue: string
    view_to_cart_rate: number
    cart_to_purchase_rate: number
  }>
  recentEvents: Array<{
    id: string
    event_type: string
    customer_email?: string
    product_id?: string
    value?: number
    created_at: string
  }>
}

const CustomerAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState(30)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?days=${period}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }
      
      setData(result)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Customer Analytics Dashboard</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Customer Analytics Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Analytics Dashboard</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded ${
                period === days 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</p>
          <p className="text-xs text-gray-400">{data.summary.period}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
          <p className="text-2xl font-bold text-blue-600">{data.summary.totalCustomers}</p>
          <p className="text-xs text-gray-400">{data.summary.period}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold text-purple-600">{data.summary.totalOrders}</p>
          <p className="text-xs text-gray-400">{data.summary.period}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Avg Order Value</h3>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.summary.avgOrderValue)}</p>
          <p className="text-xs text-gray-400">{data.summary.period}</p>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Top Customers by LTV</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LTV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AOV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.customerAnalytics.slice(0, 10).map((customer, index) => (
                <tr key={customer.customer_email} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.customer_email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.total_orders}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">
                    {formatCurrency(customer.lifetime_value)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(customer.avg_order_value)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(customer.checkout_conversion_rate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Analytics Chart */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Daily Performance</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customers</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.dailyAnalytics.slice(0, 14).map((day) => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{formatDate(day.date)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{day.total_events}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{day.unique_customers}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{day.unique_sessions}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{day.purchases}</td>
                    <td className="px-4 py-2 text-sm font-medium text-green-600">
                      {formatCurrency(day.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Top Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Add to Cart</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.productAnalytics.slice(0, 10).map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.product_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.views}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.add_to_carts}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.purchases}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(product.view_to_cart_rate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.recentEvents.slice(0, 20).map((event) => (
              <div key={event.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    event.event_type === 'purchase' ? 'bg-green-100 text-green-800' :
                    event.event_type === 'add_to_cart' ? 'bg-yellow-100 text-yellow-800' :
                    event.event_type === 'product_view' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.event_type}
                  </span>
                  <span className="text-sm text-gray-600">
                    {event.customer_email || 'Anonymous'}
                  </span>
                  {event.product_id && (
                    <span className="text-xs text-gray-500">
                      Product: {event.product_id}
                    </span>
                  )}
                  {event.value && (
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(event.value)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerAnalyticsDashboard