# Aurora Commerce - Required Supabase Tables Checklist

This document lists all the tables required for Aurora Commerce to function properly. Run the verification script and ensure all these tables exist in your Supabase database.

## Core E-commerce Tables (4 tables)

### 1. `products`
- **Purpose**: Store product catalog data
- **Setup File**: `database/products-setup.sql` or similar
- **Used In**: Product listings, search, checkout process
- **Required**: ✅ Critical for basic e-commerce functionality

### 2. `orders`
- **Purpose**: Store customer orders
- **Setup File**: `database/orders-setup.sql` or similar  
- **Used In**: Order management, checkout, Stripe webhooks
- **Required**: ✅ Critical for order processing

### 3. `order_items`
- **Purpose**: Store individual items within orders
- **Setup File**: Part of orders setup
- **Used In**: Order details, inventory tracking
- **Required**: ✅ Critical for order line items

### 4. `carts`
- **Purpose**: Store shopping cart data
- **Setup File**: `database/carts-setup.sql` or similar
- **Used In**: Shopping cart functionality, checkout
- **Required**: ✅ Critical for shopping experience

## Reviews and Ratings (2 tables)

### 5. `product_reviews`
- **Purpose**: Store product reviews and ratings
- **Setup File**: `database/reviews-setup.sql`
- **Used In**: Product review API, display ratings
- **Required**: ✅ Important for customer trust

### 6. `reviews`
- **Purpose**: Alternative/legacy reviews table
- **Setup File**: May be duplicate of product_reviews
- **Used In**: Review functionality
- **Required**: ⚠️ Check if this duplicates product_reviews

## Analytics Tables (5 tables)

### 7. `events`
- **Purpose**: Track user analytics events
- **Setup File**: `database/analytics-setup.sql`
- **Used In**: Analytics tracking, dashboard
- **Required**: 📊 Important for business insights

### 8. `analytics_events`
- **Purpose**: Alternative analytics events table
- **Setup File**: Part of analytics setup
- **Used In**: Analytics dashboard
- **Required**: ⚠️ Check if this duplicates events table

### 9. `customer_analytics`
- **Purpose**: Store aggregated customer analytics
- **Setup File**: `database/analytics-setup.sql`
- **Used In**: Analytics dashboard
- **Required**: 📊 Important for customer insights

### 10. `daily_analytics`
- **Purpose**: Store daily aggregated analytics
- **Setup File**: `database/analytics-setup.sql`
- **Used In**: Analytics dashboard
- **Required**: 📊 Important for trend analysis

### 11. `product_analytics`
- **Purpose**: Store product-specific analytics
- **Setup File**: `database/analytics-setup.sql`
- **Used In**: Product performance tracking
- **Required**: 📊 Important for product insights

## Email Marketing Tables (4 tables)

### 12. `abandoned_carts`
- **Purpose**: Track abandoned shopping carts for email marketing
- **Setup File**: `database/email-marketing-setup.sql`
- **Used In**: Abandoned cart email campaigns
- **Required**: 📧 Important for conversion recovery

### 13. `email_templates`
- **Purpose**: Store email template designs
- **Setup File**: `database/email-marketing-setup.sql`
- **Used In**: Email campaign system
- **Required**: 📧 Important for email marketing

### 14. `email_sends`
- **Purpose**: Track email send history
- **Setup File**: `database/email-marketing-setup.sql`
- **Used In**: Email campaign tracking
- **Required**: 📧 Important for email analytics

### 15. `email_campaigns`
- **Purpose**: Store email campaign configurations
- **Setup File**: `database/email-marketing-setup.sql`
- **Used In**: Email marketing management
- **Required**: 📧 Important for campaign management

## Notification Tables (2 tables)

### 16. `order_notifications`
- **Purpose**: Store order-related notifications
- **Setup File**: Likely in priority/notification setup
- **Used In**: Order priority tagging, notifications
- **Required**: 🔔 Important for order management

### 17. `priority_alerts`
- **Purpose**: Store high-priority alerts
- **Setup File**: Likely in priority setup
- **Used In**: Automated priority tagging system
- **Required**: 🔔 Important for urgent order handling

## Chat Support Tables (5 tables)

### 18. `chat_sessions`
- **Purpose**: Store chat session data
- **Setup File**: `database/chat-support-setup.sql`
- **Used In**: Chat support functionality
- **Required**: 💬 Critical for chat support

### 19. `chat_messages`
- **Purpose**: Store individual chat messages
- **Setup File**: `database/chat-support-setup.sql`
- **Used In**: Chat message history
- **Required**: 💬 Critical for chat support

### 20. `contact_submissions`
- **Purpose**: Store contact form submissions
- **Setup File**: `database/chat-support-setup.sql`
- **Used In**: Contact form fallback when chat unavailable
- **Required**: 💬 Important for offline support

### 21. `business_hours_config`
- **Purpose**: Store business hours configuration
- **Setup File**: `database/chat-support-setup.sql`
- **Used In**: Determine when chat support is available
- **Required**: 💬 Important for business hours logic

### 22. `chat_agent_availability`
- **Purpose**: Track when support agents are available
- **Setup File**: `database/chat-support-setup.sql`
- **Used In**: Route chat requests to available agents
- **Required**: 💬 Important for agent management

## User Management Tables (2 tables)

### 23. `users`
- **Purpose**: Store user account information
- **Setup File**: Usually handled by Supabase auth automatically
- **Used In**: User authentication, profiles
- **Required**: 👤 Critical for user management

### 24. `user_profiles`
- **Purpose**: Store extended user profile data
- **Setup File**: Custom user profile setup
- **Used In**: User preferences, profile management
- **Required**: 👤 Important for user experience

## Verification Steps

1. **Run the verification script**:
   ```sql
   -- Run the contents of database/verify-tables.sql in your Supabase SQL editor
   ```

2. **Check the results**:
   - Each table should show `exists = 1`
   - Total count should be 24 tables
   - Any table showing `exists = 0` is missing

3. **Setup missing tables**:
   - **Chat Support**: Run `database/chat-support-setup.sql`
   - **Analytics**: Run `database/analytics-setup.sql`
   - **Email Marketing**: Run `database/email-marketing-setup.sql`
   - **Notifications**: Check for notification setup SQL files
   - **Core E-commerce**: Check main database setup files

## Priority Order for Setup

1. **CRITICAL** (App won't work without these):
   - products, orders, order_items, carts
   - users (usually auto-created by Supabase)

2. **HIGH PRIORITY** (Major features broken):
   - chat_sessions, chat_messages, contact_submissions, business_hours_config
   - product_reviews

3. **MEDIUM PRIORITY** (Nice to have features):
   - Analytics tables for dashboard
   - Email marketing tables for campaigns
   - Notification tables for alerts

4. **LOW PRIORITY** (Optional enhancements):
   - user_profiles for extended profiles
   - chat_agent_availability for advanced routing

## Quick Setup Commands

```bash
# Setup all tables (run these in your Supabase SQL editor)
# 1. Core chat support
cat database/chat-support-setup.sql

# 2. Analytics (if file exists)
cat database/analytics-setup.sql

# 3. Email marketing (if file exists)  
cat database/email-marketing-setup.sql

# 4. Verify all tables are created
cat database/verify-tables.sql
```