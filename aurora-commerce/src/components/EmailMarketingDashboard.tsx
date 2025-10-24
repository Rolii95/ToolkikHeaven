'use client'

import React, { useState, useEffect } from 'react'

interface AbandonedCart {
  id: string
  session_id: string
  customer_email?: string
  cart_items: string
  cart_total: number
  abandoned_at: string
  reminder_sent_at?: string
  is_recovered: boolean
}

interface AbandonedCartData {
  abandoned_carts: AbandonedCart[]
  summary: {
    total_abandoned: number
    total_value: string
    with_email: number
    reminders_sent: number
    recovered: number
    recovery_rate: string
  }
}

const EmailMarketingDashboard: React.FC = () => {
  const [data, setData] = useState<AbandonedCartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testType, setTestType] = useState('order_confirmation')
  const [sending, setSending] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/email/abandoned-cart')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch abandoned carts')
      }
      
      setData(result)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      console.error('Abandoned cart fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    try {
      setSending(true)
      const response = await fetch(`/api/email/send?test=${testType}&email=${testEmail}`)
      const result = await response.json()
      
      if (response.ok) {
        alert(`✅ Test email sent to ${testEmail}`)
      } else {
        alert(`❌ Failed to send: ${result.error}`)
      }
    } catch (err) {
      alert('❌ Error sending test email')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Marketing Dashboard</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
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
        <h1 className="text-3xl font-bold mb-6">Email Marketing Dashboard</h1>
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

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const parseCartItems = (itemsStr: string) => {
    try {
      return JSON.parse(itemsStr)
    } catch {
      return []
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Email Marketing Dashboard</h1>

      {/* Test Email Section */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">Test Email Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="order_confirmation">Order Confirmation</option>
              <option value="abandoned_cart_reminder">Abandoned Cart</option>
              <option value="welcome_email">Welcome Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <button
              onClick={sendTestEmail}
              disabled={sending}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-500">Total Abandoned</h3>
              <p className="text-2xl font-bold text-orange-600">{data.summary.total_abandoned}</p>
              <p className="text-xs text-gray-400">Shopping carts</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-500">Lost Revenue</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.summary.total_value)}</p>
              <p className="text-xs text-gray-400">Potential revenue</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-500">Emails Sent</h3>
              <p className="text-2xl font-bold text-blue-600">{data.summary.reminders_sent}</p>
              <p className="text-xs text-gray-400">Reminder emails</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-500">Recovery Rate</h3>
              <p className="text-2xl font-bold text-green-600">{data.summary.recovery_rate}</p>
              <p className="text-xs text-gray-400">Completed purchases</p>
            </div>
          </div>

          {/* Abandoned Carts Table */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Abandoned Carts</h2>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abandoned At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminder</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.abandoned_carts.map((cart) => {
                    const items = parseCartItems(cart.cart_items)
                    return (
                      <tr key={cart.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {cart.customer_email || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-red-600">
                          {formatCurrency(cart.cart_total)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                          <div className="text-xs text-gray-500">
                            {items.slice(0, 2).map((item: any, i: number) => (
                              <div key={i}>{item.name}</div>
                            ))}
                            {items.length > 2 && <div>+{items.length - 2} more</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(cart.abandoned_at)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {cart.reminder_sent_at ? (
                            <span className="text-green-600">
                              ✅ {formatDate(cart.reminder_sent_at)}
                            </span>
                          ) : cart.customer_email ? (
                            <span className="text-yellow-600">⏳ Pending</span>
                          ) : (
                            <span className="text-gray-400">No email</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {cart.is_recovered ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Recovered
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Abandoned
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EmailMarketingDashboard