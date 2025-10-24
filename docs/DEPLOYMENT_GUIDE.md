# Order Prioritization Engine - Deployment Guide

## 🚀 Quick Deployment

Your Order Prioritization Engine is ready for deployment! Follow these steps to set it up.

## Step 1: Deploy Database Schema

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your Aurora Commerce project

2. **Execute Master Setup Script**
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy the entire contents of `database/master-order-prioritization-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

   This will:
   - ✅ Add missing columns to existing tables
   - ✅ Create order prioritization functions
   - ✅ Set up automatic priority calculation triggers
   - ✅ Create admin dashboard views
   - ✅ Insert sample prioritized orders

## Step 2: Verify Database Deployment

After running the script, verify it worked by running this test query in the SQL Editor:

```sql
-- Test query to verify setup
SELECT 
  order_number,
  total_amount,
  priority_level,
  priority_score,
  fulfillment_priority,
  priority_tags,
  shipping_method,
  is_high_value,
  is_vip_customer
FROM orders 
ORDER BY priority_score DESC 
LIMIT 5;
```

You should see sample orders with automatic priority calculations.

## Step 3: Access Admin Dashboard

1. **Start the Next.js Application**
   ```bash
   cd aurora-commerce
   npm run dev
   ```

2. **Access the Admin Dashboard**
   - Navigate to: `http://localhost:3000/admin/orders`
   - The dashboard will show:
     - 📊 Real-time order prioritization
     - 🏷️ Priority tags and levels
     - 🔍 Advanced filtering and sorting
     - ⚡ Bulk operations for order management

## ✨ Features Now Available

### Automatic Order Prioritization
- **High-Value Orders**: Orders over $500 automatically tagged as priority
- **Express Shipping**: Overnight/express orders get elevated priority
- **VIP Customers**: Repeat customers with $2000+ spending or 10+ orders
- **Real-time Calculation**: Priority scores update automatically

### Priority Levels
- 🔴 **Level 1 (Urgent)**: VIP customers + express shipping + high value
- 🟠 **Level 2 (High)**: High-value orders or express shipping
- 🟡 **Level 3 (Normal)**: Standard orders (default)
- 🔵 **Level 4 (Low)**: Delayed or non-urgent orders
- ⚪ **Level 5 (Lowest)**: Bulk or future-dated orders

### Admin Dashboard Features
- **Priority Queue View**: Orders sorted by urgency
- **Customer Tier Filtering**: Filter by VIP, regular, new customers
- **Shipping Method Sorting**: Group by express, standard, economy
- **Bulk Operations**: Update multiple order priorities
- **Real-time Updates**: Live priority recalculation

## 🔧 API Endpoints Available

After deployment, these endpoints will be active:

- `GET /api/admin/orders` - Fetch prioritized orders
- `PUT /api/admin/orders/[id]` - Update order priority
- `POST /api/admin/orders/bulk-update` - Bulk priority updates
- `GET /api/admin/dashboard/stats` - Priority statistics

## 📋 Testing the System

### Test High-Value Order Creation
```javascript
// Example: Create a high-value order that should auto-prioritize
const testOrder = {
  order_number: "ORD-001",
  customer_id: "existing-customer-id",
  total_amount: 750.00, // Over $500 threshold
  subtotal: 750.00,
  shipping_method: "express", // Express shipping
  items: [
    {
      product_id: "prod-1",
      name: "Premium Product",
      quantity: 1,
      price: 750.00
    }
  ]
};
```

This order should automatically receive:
- Priority Level: 2 (High)
- Priority Score: ~85
- Tags: ["high-value", "express-shipping"]

### Test VIP Customer Order
Orders from customers with `is_vip: true` will automatically get elevated priority regardless of order value.

## 🚨 Troubleshooting

### Common Issues

1. **"Column does not exist" errors**
   - Re-run the master setup script
   - Check the SQL Editor for any error messages

2. **Admin dashboard shows no orders**
   - Verify the database script completed successfully
   - Check that sample orders were inserted

3. **Priority calculations not working**
   - Ensure the trigger functions were created
   - Test by manually inserting an order over $500

## 📞 Need Help?

If you encounter any issues:
1. Check the Supabase SQL Editor for error messages
2. Verify your `.env.local` has the correct database credentials
3. Test the API endpoints using the browser developer tools

---

🎉 **Your Order Prioritization Engine is now ready!** 

The system will automatically prioritize orders based on customer value, shipping urgency, and business rules, helping your fulfillment team focus on the most important orders first.