# Inventory Threshold Alerts Implementation Guide

## Overview

The Inventory Threshold Alerts system automatically monitors stock levels and sends notifications when products fall below configurable thresholds. This prevents lost sales by ensuring timely restock actions.

## Architecture Components

### 1. Database Layer
- **PostgreSQL Triggers**: Real-time stock monitoring on product updates
- **Inventory Alerts Table**: Tracks all alert history and status
- **Threshold Configuration**: Customizable thresholds by product or category
- **Webhook Configuration**: Manages external notification endpoints

### 2. Edge Function
- **Supabase Edge Function**: Periodic inventory checks and webhook notifications
- **Retry Logic**: Automatic retry with exponential backoff for failed notifications
- **Multiple Webhook Support**: Primary and backup notification channels

### 3. Admin Dashboard
- **Real-time Monitoring**: Live view of inventory alerts and stock levels
- **Alert Management**: Resolve alerts and configure thresholds
- **Webhook Testing**: Test notification endpoints and view statistics

## Installation Steps

### 1. Database Setup

#### Execute the main inventory alerts schema:
```sql
-- Run this in your Supabase SQL Editor
-- File: /database/inventory-alerts-setup.sql
```

#### Execute the webhook configuration schema:
```sql
-- Run this in your Supabase SQL Editor  
-- File: /database/webhook-alert-config.sql
```

### 2. Supabase Edge Function Deployment

#### Install Supabase CLI (if not already installed):
```bash
npm install -g supabase
```

#### Login to Supabase:
```bash
supabase login
```

#### Initialize and link your project:
```bash
cd /workspaces/ToolkikHeaven/aurora-commerce
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

#### Deploy the Edge Function:
```bash
supabase functions deploy inventory-check
```

### 3. Environment Variables

#### Set these in your Supabase Dashboard > Edge Functions > Settings:

```bash
# Primary webhook URL (Zapier, BuildShip, etc.)
INVENTORY_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_HOOK_ID/

# Backup webhook URL (optional)
BACKUP_WEBHOOK_URL=https://api.buildship.app/trigger/YOUR_BACKUP_TRIGGER

# These are auto-provided by Supabase:
# SUPABASE_URL=your-project-url
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Cron Job Setup

#### Option A: Using Supabase Cron (Recommended)
```sql
-- Enable pg_cron extension in Supabase Dashboard > Database > Extensions

-- Schedule hourly inventory checks
SELECT cron.schedule(
  'inventory-check-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT 
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/inventory-check',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

#### Option B: External Cron Service
Use services like cron-job.org, EasyCron, or your server's cron:

```bash
# Add to crontab for hourly checks
0 * * * * curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/inventory-check" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 5. Next.js Integration

#### Add the admin route to your navigation:
```typescript
// Add to your admin navigation
const adminRoutes = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Inventory Alerts', href: '/admin/inventory' }, // New route
  { name: 'Orders', href: '/admin/orders' },
];
```

#### Update your Supabase client configuration:
```typescript
// Ensure your Supabase client has the correct environment variables
// File: /lib/supabase.ts or similar

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // For server-side operations
```

## Configuration Guide

### 1. Setting Up Webhooks

#### Zapier Integration:
1. Create a new Zap in Zapier
2. Choose "Webhooks by Zapier" as trigger
3. Select "Catch Hook" 
4. Copy the webhook URL to your environment variables
5. Configure actions (email, Slack, sheets, etc.)

#### BuildShip Integration:
1. Create a new workflow in BuildShip
2. Add a "Webhook Trigger" node
3. Copy the trigger URL to your environment variables
4. Add processing nodes for notifications

#### Slack Integration:
1. Create a Slack app in your workspace
2. Enable Incoming Webhooks
3. Create a webhook for your desired channel
4. Use the webhook URL in your configuration

### 2. Threshold Configuration

#### Default Thresholds:
```sql
-- Example threshold settings
INSERT INTO inventory_thresholds (category, low_stock_threshold, critical_stock_threshold, out_of_stock_threshold)
VALUES 
  ('Electronics', 20, 5, 0),
  ('Clothing', 25, 10, 0),
  ('Furniture', 10, 3, 0);
```

#### Product-Specific Thresholds:
```sql
-- Set specific thresholds for high-demand products
INSERT INTO inventory_thresholds (product_id, low_stock_threshold, critical_stock_threshold, out_of_stock_threshold)
VALUES 
  ('product-uuid-here', 50, 15, 0); -- Higher thresholds for popular items
```

### 3. Testing Your Setup

#### Test the database trigger:
```sql
-- Update a product's stock to trigger an alert
UPDATE products 
SET stock = 5 
WHERE name = 'Test Product';

-- Check if alert was created
SELECT * FROM inventory_alerts ORDER BY created_at DESC LIMIT 5;
```

#### Test the Edge Function:
```bash
# Manual trigger via curl
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/inventory-check" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

#### Test webhooks in the admin dashboard:
1. Visit `/admin/inventory`
2. Go to "Settings" tab
3. Click "Test" on any configured webhook

## Webhook Payload Structure

### Standard Payload:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "alert_count": 3,
  "alerts": [
    {
      "alert_id": "uuid",
      "product_id": "uuid", 
      "product_name": "iPhone 15",
      "category": "Electronics",
      "alert_type": "low_stock",
      "current_stock": 12,
      "threshold_value": 15,
      "alert_message": "WARNING: iPhone 15 is running low on stock. Current stock: 12 units (threshold: 15). Please consider restocking."
    }
  ],
  "summary": {
    "out_of_stock": 0,
    "critical_stock": 1, 
    "low_stock": 2
  }
}
```

### Slack-Formatted Payload:
```json
{
  "text": "🏪 Aurora Commerce Inventory Alert - 3 items need attention",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🏪 Inventory Alert Summary"
      }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Out of Stock:* 0" },
        { "type": "mrkdwn", "text": "*Critical Stock:* 1" },
        { "type": "mrkdwn", "text": "*Low Stock:* 2" },
        { "type": "mrkdwn", "text": "*Total Alerts:* 3" }
      ]
    }
  ]
}
```

## Monitoring and Maintenance

### 1. Dashboard Metrics
- **Active Alerts**: Current unresolved alerts by type
- **Product Status**: Overview of all low-stock products
- **Notification Success Rate**: Webhook delivery statistics
- **Response Times**: Average notification delivery times

### 2. Log Analysis
```sql
-- View recent alert activity
SELECT * FROM inventory_alert_logs 
ORDER BY check_timestamp DESC 
LIMIT 10;

-- Check webhook success rates
SELECT * FROM get_webhook_statistics();

-- Review notification history
SELECT 
  anh.*,
  ia.alert_type,
  p.name as product_name
FROM alert_notification_history anh
JOIN inventory_alerts ia ON anh.alert_id = ia.id
JOIN products p ON ia.product_id = p.id
ORDER BY anh.created_at DESC;
```

### 3. Automated Cleanup
The system includes automatic cleanup of old logs:
```sql
-- Manually run cleanup (runs automatically via trigger)
SELECT cleanup_old_inventory_logs();
```

## Troubleshooting

### Common Issues:

#### 1. Edge Function Not Triggering
- Check cron job configuration
- Verify environment variables
- Review function logs in Supabase Dashboard

#### 2. Webhooks Failing
- Test webhook URLs manually
- Check authentication headers
- Verify timeout settings
- Review retry attempts in logs

#### 3. Alerts Not Creating
- Verify trigger is installed: `\df check_inventory_threshold`
- Check threshold configurations
- Test with manual stock updates

#### 4. Performance Issues
- Add indexes on frequently queried columns
- Monitor function execution time
- Consider pagination for large datasets

### Debugging Commands:
```sql
-- Check if triggers are active
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'inventory_threshold_trigger';

-- View recent function calls
SELECT * FROM inventory_alert_logs 
ORDER BY check_timestamp DESC 
LIMIT 5;

-- Check webhook configurations
SELECT name, url, is_active, webhook_type 
FROM webhook_configs;
```

## Security Considerations

1. **Environment Variables**: Never commit webhook URLs or API keys
2. **Row Level Security**: Enabled on all tables with authenticated user policies
3. **Webhook Authentication**: Use authorization headers for sensitive endpoints
4. **Rate Limiting**: Edge functions have built-in rate limiting
5. **Data Retention**: Automatic cleanup of old logs to prevent data bloat

## Performance Optimization

1. **Database Indexes**: Added on all frequently queried columns
2. **Function Caching**: Edge functions cache product data
3. **Batch Processing**: Multiple alerts sent in single webhook call
4. **Retry Logic**: Exponential backoff prevents system overload
5. **Pagination**: Dashboard uses pagination for large datasets

## Cost Considerations

1. **Edge Function Executions**: ~720 executions/month (hourly checks)
2. **Database Operations**: Minimal impact with proper indexing
3. **Webhook Calls**: Depends on alert frequency
4. **Storage**: Alert logs cleaned up automatically after 90 days

This system provides a robust, scalable solution for inventory monitoring that integrates seamlessly with your existing Aurora Commerce application.