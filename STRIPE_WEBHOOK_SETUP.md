# Stripe Webhook Setup Guide

## 🎯 Webhook Endpoint Configuration

Your Stripe webhook endpoint is already implemented at:
```
/api/stripe/webhook
```

## 🔧 Complete Setup Instructions

### Step 1: Get Your Stripe Keys

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com
2. **Get your API keys**:
   - Go to **Developers** → **API keys**
   - Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Update Environment Variables

Replace the placeholder values in your `.env.local`:

```bash
# Replace these with your actual Stripe keys:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 3: Configure Webhook in Stripe Dashboard

1. **Go to Webhooks**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Configure the webhook**:

   **Endpoint URL**: 
   - For development: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
   - For production: `https://your-domain.com/api/stripe/webhook`

   **Events to send**:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded` (optional)
   - ✅ `payment_intent.payment_failed` (optional)

4. **Copy the webhook secret**:
   - After creating the webhook, click on it
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)
   - Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 4: Local Development Setup

For local testing, you'll need to expose your local server:

#### Option A: Using ngrok (Recommended)
```bash
# Install ngrok if you haven't already
npm install -g ngrok

# In a separate terminal, expose your local server
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this URL + /api/stripe/webhook in Stripe dashboard
```

#### Option B: Using Stripe CLI
```bash
# Install Stripe CLI
# Login to your Stripe account
stripe login

# Forward events to your local webhook
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Step 5: Test Your Webhook

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test the webhook**:
   - Go to your Stripe webhook in the dashboard
   - Click "Send test webhook"
   - Choose `checkout.session.completed`
   - Click "Send test webhook"

3. **Check your application logs** for webhook processing

## 🔍 What the Webhook Does

Your webhook at `/api/stripe/webhook` handles:

### ✅ Payment Processing
- **Verifies webhook signature** for security
- **Updates order status** to "paid" in your database
- **Sends order confirmation emails** to customers
- **Logs payment details** for tracking

### ✅ Event Handling
- **`checkout.session.completed`**: Main payment success event
- **Order updates**: Links Stripe payments to your orders
- **Email notifications**: Automatic customer confirmations

### ✅ Security Features
- **Signature verification**: Ensures webhooks come from Stripe
- **Error handling**: Graceful failure management
- **Logging**: Comprehensive event tracking

## 🧪 Testing Your Setup

### Test Webhook Processing:
```bash
# Check if webhook endpoint is accessible
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Expected Response:
```json
{
  "error": "Webhook signature verification failed"
}
```
This error is expected without proper Stripe signature - it means the endpoint is working!

## 🚀 Production Deployment

### For Vercel:
1. **Add environment variables** in Vercel dashboard:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

2. **Update webhook URL** in Stripe:
   - Replace with your production domain
   - Example: `https://your-app.vercel.app/api/stripe/webhook`

### For other platforms:
- Ensure all Stripe environment variables are set
- Update webhook URL to your production domain
- Test webhook delivery in Stripe dashboard

## 🔧 Troubleshooting

### Common Issues:

1. **"Webhook signature verification failed"**
   - Check your `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure the secret matches the webhook in Stripe dashboard

2. **"Stripe not configured"**
   - Verify `STRIPE_SECRET_KEY` is set in environment
   - Check the key format (should start with `sk_`)

3. **Orders not updating**
   - Verify your database connection
   - Check that orders table exists
   - Ensure order_id is passed in Stripe session metadata

4. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify events are selected in Stripe dashboard
   - Test with ngrok for local development

### Debug Logs:
Check your application logs for:
- ✅ `Order X marked as paid via webhook`
- ✅ `Order confirmation email sent to customer@email.com`
- ❌ `Webhook signature verification failed`
- ❌ `Error updating order status after webhook`

## 📞 Support Resources

- **Stripe Webhook Guide**: https://stripe.com/docs/webhooks
- **Stripe Testing**: https://stripe.com/docs/testing
- **Ngrok Documentation**: https://ngrok.com/docs

## ✅ Verification Checklist

- [ ] Stripe API keys added to `.env.local`
- [ ] Webhook created in Stripe dashboard
- [ ] Webhook secret added to environment variables
- [ ] Local development server running
- [ ] Webhook endpoint accessible (via ngrok or Stripe CLI)
- [ ] Test webhook sent successfully
- [ ] Order status updates working
- [ ] Email confirmations sending

Once completed, your Stripe webhook will automatically:
- Process payments securely
- Update order statuses in real-time
- Send customer confirmation emails
- Handle payment failures gracefully

🎉 **Your Aurora Commerce payment system is now fully automated!**