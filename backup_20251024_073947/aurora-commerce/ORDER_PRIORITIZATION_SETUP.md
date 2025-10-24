# Order Prioritization Engine Implementation Guide

## Overview

The Order Prioritization Engine automatically tags and prioritizes high-value orders, express shipping, and repeat customers for faster fulfillment. This system improves customer experience by ensuring critical orders receive immediate attention.

## Features Implemented

### 🎯 **Automatic Priority Calculation**
- **High-Value Orders**: Orders over $500 get higher priority
- **Express Shipping**: Overnight/express orders get urgent priority  
- **VIP Customers**: Repeat customers and high-spending customers get priority treatment
- **Configurable Rules**: Business rules can be customized via database configuration

### 📊 **Admin Dashboard**
- **Real-time Order Monitoring**: Live view of all orders with priority indicators
- **Advanced Filtering**: Filter by status, priority, shipping method, customer type
- **Bulk Actions**: Update multiple orders simultaneously
- **Priority Management**: Manual priority override capabilities

### 🔔 **Automated Notifications**
- **Real-time Alerts**: Instant notifications for urgent orders
- **Role-based Notifications**: Different alerts for admin, fulfillment, and customer service
- **Priority Alerts**: Special alerts for urgent and high-value orders

### 📈 **Performance Analytics**
- **Dashboard Metrics**: Order volume, priority distribution, fulfillment performance
- **Customer Insights**: VIP customer tracking and order history
- **Priority Statistics**: Success rates and processing times by priority level

## Installation Steps

### 1. Database Setup

#### Execute the main order prioritization schema:
```sql
-- Run this in your Supabase SQL Editor
-- File: /database/order-prioritization-setup.sql
```

#### Execute the notifications and alerts schema:
```sql
-- Run this in your Supabase SQL Editor  
-- File: /database/order-notifications-setup.sql
```

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Email service for notifications
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### 3. Next.js Integration

#### Add the admin routes to your navigation:
```typescript
// Update your admin navigation component
const adminRoutes = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Orders', href: '/admin/orders' }, // New route
  { name: 'Inventory', href: '/admin/inventory' },
  { name: 'Products', href: '/admin/products' },
];
```

#### Update your layout for admin sections:
```typescript
// Add to your admin layout
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Management - Aurora Commerce Admin',
  robots: { index: false, follow: false }, // Prevent search engine indexing
};
```

## Configuration Guide

### 1. Priority Rules Configuration

The system uses configurable business rules to calculate priority scores:

#### Default Rules:
```sql
-- View current rules
SELECT * FROM order_priority_rules WHERE is_active = TRUE ORDER BY rule_order;

-- Add custom rule
INSERT INTO order_priority_rules (
  rule_name, 
  rule_type, 
  condition_field, 
  condition_operator, 
  condition_value, 
  priority_adjustment, 
  description
) VALUES (
  'Premium Products',
  'product_category',
  'category',
  'IN',
  'premium,luxury',
  -2,
  'Premium products get higher priority'
);
```

#### Rule Types:
- **order_value**: Based on total order amount
- **shipping_method**: Based on shipping speed/type
- **customer_tier**: Based on customer status (VIP, repeat)
- **product_category**: Based on product types
- **custom**: Custom business logic

### 2. Customer Tier Management

#### Customer tiers are automatically calculated based on:
- **Bronze**: $0 - $499 total spent
- **Silver**: $500 - $1,999 total spent  
- **Gold**: $2,000 - $4,999 total spent
- **Platinum**: $5,000+ total spent

#### VIP Status:
- Customers with $2,000+ total spent OR 10+ orders
- Can be manually overridden in customer records

### 3. Priority Levels

#### The system uses 5 priority levels:
1. **URGENT** (Score 80-100): Immediate attention required
2. **HIGH** (Score 65-79): Process within 2 hours
3. **NORMAL** (Score 35-64): Standard processing
4. **LOW** (Score 20-34): Process when capacity allows
5. **LOWEST** (Score 1-19): Lowest priority

## API Usage

### 1. Get Orders with Filters

```typescript
// GET /api/admin/orders
const response = await fetch('/api/admin/orders?' + new URLSearchParams({
  status: 'pending,processing',
  priority_level: '1,2',
  is_high_value: 'true',
  sort_by: 'priority_level',
  sort_order: 'asc',
  limit: '20',
  offset: '0'
}));

const { data, total, pagination } = await response.json();
```

### 2. Create Order with Auto-Priority

```typescript
// POST /api/admin/orders
const newOrder = await fetch('/api/admin/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_email: 'customer@example.com',
    customer_id: 'optional-customer-uuid',
    total_amount: 750.00,
    subtotal: 650.00,
    tax_amount: 50.00,
    shipping_amount: 50.00,
    shipping_method: 'express',
    items: [
      {
        product_name: 'iPhone 15',
        product_id: 'product-uuid',
        quantity: 1,
        unit_price: 650.00,
        total_price: 650.00,
        product_category: 'Electronics'
      }
    ],
    billing_address: { /* address object */ },
    shipping_address: { /* address object */ }
  })
});
```

### 3. Update Order Status/Priority

```typescript
// PATCH /api/admin/orders/{id}
await fetch(`/api/admin/orders/${orderId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update_status',
    status: 'processing',
    changed_by: 'admin@example.com',
    reason: 'Ready for fulfillment'
  })
});

// Update priority
await fetch(`/api/admin/orders/${orderId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update_priority',
    priority_level: 1
  })
});
```

### 4. Bulk Operations

```typescript
// POST /api/admin/orders/bulk
await fetch('/api/admin/orders/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update_status',
    order_ids: ['uuid1', 'uuid2', 'uuid3'],
    data: {
      status: 'processing',
      changed_by: 'admin@example.com'
    }
  })
});
```

## Real-time Notifications

### 1. Setup Real-time Listeners

```typescript
import AutomatedPriorityTaggingService from '@/lib/automated-priority-tagging';

// Setup real-time order monitoring
const channel = await AutomatedPriorityTaggingService.setupRealtimeListeners();

// Subscribe to admin notifications
const adminChannel = supabase
  .channel('admin-notifications')
  .on('broadcast', { event: 'order_notification' }, (payload) => {
    console.log('New order notification:', payload);
    // Update UI with new notification
  })
  .subscribe();
```

### 2. Get Unread Notifications

```typescript
// Get notifications by role
const notifications = await AutomatedPriorityTaggingService
  .getUnreadNotifications('admin');

const alerts = await AutomatedPriorityTaggingService
  .getActivePriorityAlerts();
```

### 3. Mark as Read/Acknowledged

```typescript
// Mark notifications as read
await AutomatedPriorityTaggingService
  .markNotificationsAsRead(['notif-id-1', 'notif-id-2']);

// Acknowledge priority alerts
await AutomatedPriorityTaggingService
  .acknowledgePriorityAlerts(['alert-id-1'], 'admin@example.com');
```

## Dashboard Features

### 1. Order Overview
- **Summary Cards**: Quick metrics for urgent, high-priority, pending orders
- **Real-time Updates**: Live order counts and values
- **Priority Distribution**: Visual breakdown of orders by priority level

### 2. Advanced Filtering
- **Multi-select Filters**: Status, priority, shipping method
- **Customer Type Filters**: VIP customers, high-value orders
- **Search**: Order number or customer email
- **Sorting**: By priority, date, value, or customer

### 3. Bulk Actions
- **Status Updates**: Mark multiple orders as processing/shipped
- **Priority Changes**: Bulk priority adjustments
- **Export Options**: Download filtered order lists

### 4. Order Details
- **Priority Indicators**: Color-coded priority levels
- **Customer Information**: Customer tier, order history
- **Shipping Details**: Method, estimated delivery
- **Order Tags**: Automatic tags (high-value, VIP, express)

## Performance Optimization

### 1. Database Indexes
All critical queries are optimized with proper indexing:
```sql
-- View existing indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('orders', 'customers', 'order_items');
```

### 2. Query Optimization
- **Pagination**: Large order lists are paginated
- **Selective Loading**: Only load necessary fields
- **Cached Counts**: Summary statistics are cached

### 3. Real-time Performance
- **Efficient Triggers**: Minimal overhead on order updates
- **Batched Notifications**: Multiple notifications sent together
- **Connection Pooling**: Optimized database connections

## Monitoring and Analytics

### 1. Key Metrics
```sql
-- Order processing performance
SELECT 
  priority_level,
  COUNT(*) as order_count,
  AVG(EXTRACT(EPOCH FROM (shipped_at - placed_at))/3600) as avg_fulfillment_hours
FROM orders 
WHERE shipped_at IS NOT NULL 
GROUP BY priority_level 
ORDER BY priority_level;

-- Customer tier analysis
SELECT 
  loyalty_tier,
  COUNT(*) as customers,
  AVG(total_spent) as avg_spent,
  AVG(total_orders) as avg_orders
FROM customers 
GROUP BY loyalty_tier;
```

### 2. Alert Effectiveness
```sql
-- Notification response times
SELECT 
  notification_type,
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))/60) as avg_response_minutes
FROM order_notifications 
WHERE is_read = TRUE 
GROUP BY notification_type;
```

## Troubleshooting

### Common Issues:

#### 1. Priority Not Calculating
- Check that triggers are active: `\df update_order_priority`
- Verify rule configurations: `SELECT * FROM order_priority_rules WHERE is_active = TRUE`
- Test with sample data

#### 2. Notifications Not Sending
- Check trigger functions: `\df create_order_notifications`
- Verify real-time subscriptions are active
- Review error logs in browser console

#### 3. Performance Issues
- Monitor slow queries: Enable PostgreSQL slow query log
- Check index usage: `EXPLAIN ANALYZE` on complex queries
- Consider pagination limits

#### 4. Data Consistency
- Run priority recalculation: Call `recalculateAllPriorities()`
- Check for orphaned records: Foreign key constraints
- Verify trigger execution order

### Debugging Commands:
```sql
-- Check recent orders and their priorities
SELECT 
  order_number, 
  priority_level, 
  priority_score, 
  total_amount, 
  is_high_value,
  is_vip_customer,
  priority_tags
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- View active notifications
SELECT * FROM order_notifications 
WHERE is_read = FALSE 
ORDER BY created_at DESC;

-- Check priority rules
SELECT * FROM order_priority_rules 
WHERE is_active = TRUE 
ORDER BY rule_order;
```

## Security Considerations

1. **Row Level Security**: All tables have RLS policies for authenticated users
2. **Admin Access**: Order management requires admin authentication
3. **Audit Trail**: All priority changes and status updates are logged
4. **Data Privacy**: Customer information is protected with proper access controls
5. **API Security**: All endpoints validate input and authenticate users

## Benefits Summary

### 🚀 **Operational Efficiency**
- **Automated Prioritization**: No manual priority assignment needed
- **Smart Routing**: High-value orders automatically flagged
- **Bulk Operations**: Process multiple orders simultaneously
- **Real-time Alerts**: Immediate notification of urgent orders

### 💰 **Revenue Impact**
- **Faster VIP Service**: Priority handling for high-value customers
- **Express Shipping**: Guaranteed on-time delivery for premium orders
- **Customer Retention**: Better service leads to repeat business
- **Order Value Optimization**: Focus on high-margin orders

### 📊 **Data-Driven Insights**
- **Customer Analytics**: Track customer lifecycle and value
- **Performance Metrics**: Monitor fulfillment times by priority
- **Trend Analysis**: Identify patterns in high-priority orders
- **Resource Planning**: Optimize staffing based on order priorities

The Order Prioritization Engine provides Aurora Commerce with enterprise-level order management capabilities that scale with business growth while ensuring optimal customer experience! 🎉