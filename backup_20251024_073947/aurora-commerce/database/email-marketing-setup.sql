-- Email Marketing Database Schema
-- Tables for managing email campaigns and abandoned cart tracking

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    template_type VARCHAR(50) NOT NULL, -- 'transactional', 'marketing', 'abandoned_cart'
    variables JSONB DEFAULT '{}', -- Expected template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email sends tracking
CREATE TABLE IF NOT EXISTS email_sends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES email_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    send_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abandoned cart tracking
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    cart_items JSONB NOT NULL,
    cart_total DECIMAL(10,2) NOT NULL,
    abandoned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    recovered_at TIMESTAMP WITH TIME ZONE,
    recovery_order_id VARCHAR(255),
    is_recovered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email campaigns for marketing automation
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    campaign_type VARCHAR(50) NOT NULL, -- 'abandoned_cart', 'welcome', 'promotional'
    trigger_conditions JSONB NOT NULL, -- Conditions for sending
    schedule_type VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'delayed', 'scheduled'
    delay_hours INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sends_recipient ON email_sends(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(send_status);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_abandoned_at ON abandoned_carts(abandoned_at);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, template_type, variables) VALUES
('order_confirmation', 'Order Confirmation - Order #{{order_id}}', 
'<!DOCTYPE html>
<html>
<head><title>Order Confirmation</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Thank you for your order!</h1>
        <p>Hi {{customer_name}},</p>
        <p>We''ve received your order and are preparing it for shipment.</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> {{order_id}}</p>
            <p><strong>Total:</strong> ${{order_total}}</p>
            <p><strong>Email:</strong> {{customer_email}}</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Items Ordered:</h3>
            {{order_items_html}}
        </div>
        
        <p>You will receive a shipping confirmation email with tracking information once your order ships.</p>
        
        <p>Questions? Contact us at support@auroracommerce.com</p>
        
        <p>Thank you for shopping with us!</p>
        <p>The Aurora Commerce Team</p>
    </div>
</body>
</html>',
'Thank you for your order!

Hi {{customer_name}},

We''ve received your order and are preparing it for shipment.

Order Details:
- Order ID: {{order_id}}
- Total: ${{order_total}}
- Email: {{customer_email}}

Items Ordered:
{{order_items_text}}

You will receive a shipping confirmation email with tracking information once your order ships.

Questions? Contact us at support@auroracommerce.com

Thank you for shopping with us!
The Aurora Commerce Team',
'transactional',
'{"order_id": "string", "customer_name": "string", "customer_email": "string", "order_total": "number", "order_items_html": "string", "order_items_text": "string"}'),

('abandoned_cart_reminder', 'Don''t forget your items! Complete your order', 
'<!DOCTYPE html>
<html>
<head><title>Complete Your Order</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Don''t miss out!</h1>
        <p>Hi there,</p>
        <p>You left some great items in your cart. Complete your purchase before they''re gone!</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h2>Your Cart (${{cart_total}})</h2>
            {{cart_items_html}}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{checkout_url}}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Complete Your Order
            </a>
        </div>
        
        <p><small>This cart will be saved for 7 days. After that, items may become unavailable.</small></p>
        
        <p>Need help? Contact us at support@auroracommerce.com</p>
    </div>
</body>
</html>',
'Don''t miss out!

Hi there,

You left some great items in your cart. Complete your purchase before they''re gone!

Your Cart (${{cart_total}}):
{{cart_items_text}}

Complete your order: {{checkout_url}}

This cart will be saved for 7 days. After that, items may become unavailable.

Need help? Contact us at support@auroracommerce.com',
'abandoned_cart',
'{"cart_total": "number", "cart_items_html": "string", "cart_items_text": "string", "checkout_url": "string"}'),

('welcome_email', 'Welcome to Aurora Commerce!', 
'<!DOCTYPE html>
<html>
<head><title>Welcome!</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">Welcome to Aurora Commerce!</h1>
        <p>Hi {{customer_name}},</p>
        <p>Thank you for joining our community! We''re excited to have you.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Get Started</h2>
            <ul>
                <li>Browse our latest products</li>
                <li>Add items to your wishlist</li>
                <li>Enjoy free shipping on orders over $50</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{shop_url}}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Start Shopping
            </a>
        </div>
        
        <p>Questions? We''re here to help at support@auroracommerce.com</p>
        
        <p>Happy shopping!</p>
        <p>The Aurora Commerce Team</p>
    </div>
</body>
</html>',
'Welcome to Aurora Commerce!

Hi {{customer_name}},

Thank you for joining our community! We''re excited to have you.

Get Started:
- Browse our latest products
- Add items to your wishlist  
- Enjoy free shipping on orders over $50

Start shopping: {{shop_url}}

Questions? We''re here to help at support@auroracommerce.com

Happy shopping!
The Aurora Commerce Team',
'marketing',
'{"customer_name": "string", "shop_url": "string"}')

ON CONFLICT (name) DO NOTHING;

-- Insert default campaigns
INSERT INTO email_campaigns (name, template_id, campaign_type, trigger_conditions, delay_hours) VALUES
('Abandoned Cart Recovery', 
 (SELECT id FROM email_templates WHERE name = 'abandoned_cart_reminder'), 
 'abandoned_cart',
 '{"event_type": "cart_abandoned", "min_cart_value": 10}',
 2), -- Send 2 hours after abandonment

('Order Confirmation', 
 (SELECT id FROM email_templates WHERE name = 'order_confirmation'), 
 'transactional',
 '{"event_type": "order_confirmed"}',
 0), -- Send immediately

('Welcome Email', 
 (SELECT id FROM email_templates WHERE name = 'welcome_email'), 
 'welcome',
 '{"event_type": "customer_registered"}',
 0) -- Send immediately

ON CONFLICT DO NOTHING;