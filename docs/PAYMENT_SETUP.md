# Payment Provider Setup Guide

This guide walks you through setting up **Paddle** and **Coinbase Commerce** for the Level audio application.

---

## 1. Paddle Setup (Credit Cards + PayPal)

### Step 1: Create a Paddle Account
1. Go to [paddle.com](https://www.paddle.com/) and click "Get Started"
2. Complete the registration process
3. Verify your email and complete business verification

### Step 2: Access the Sandbox
1. Log in to [Paddle Dashboard](https://vendors.paddle.com/)
2. Toggle to **Sandbox Mode** in the top-right corner
3. All testing should be done in sandbox first

### Step 3: Create Products and Prices
1. Go to **Catalog > Products**
2. Create a new product: "Level Premium"
3. Add two prices:
   - **Monthly**: $7.99 USD, recurring monthly
   - **Yearly**: $79.99 USD, recurring yearly
4. Copy the **Price IDs** (format: `pri_01xxxxx`)

### Step 4: Get API Credentials
1. Go to **Developer Tools > Authentication**
2. Copy your **Vendor ID**
3. Generate a **Client-side Token** (for checkout)
4. Generate an **API Key** (for backend operations)
5. Copy your **Public Key** (for signature verification)

### Step 5: Configure Webhooks
1. Go to **Developer Tools > Notifications**
2. Add a new webhook destination:
   - **URL**: `https://your-backend.com/api/webhooks/paddle`
   - **Events**: Select all `subscription.*` events
3. Copy the **Webhook Secret** for signature verification

---

## 2. Coinbase Commerce Setup (Crypto Payments)

### Step 1: Create a Coinbase Commerce Account
1. Go to [commerce.coinbase.com](https://commerce.coinbase.com/)
2. Click "Get Started" and sign up
3. Complete verification (requires business info)

### Step 2: Get API Credentials
1. Go to **Settings > API Keys**
2. Click "Create an API Key"
3. Copy the **API Key** (keep it secret!)

### Step 3: Configure Webhooks
1. Go to **Settings > Webhook subscriptions**
2. Add new subscription:
   - **URL**: `https://your-backend.com/api/webhooks/coinbase`
3. Copy the **Shared Secret** for signature verification

### Step 4: Test the Integration
1. Use the Coinbase Commerce test mode
2. Create a test charge through the API
3. Verify webhook delivery in the dashboard

---

## 3. Environment Variables

Add these to your environment files:

### Frontend (.env or .env.local)
```env
# Paddle Configuration
VITE_PADDLE_CLIENT_TOKEN=your_client_token_here
VITE_PADDLE_ENV=sandbox  # Change to 'production' when live
VITE_PADDLE_PRICE_MONTHLY=pri_01xxxxx
VITE_PADDLE_PRICE_YEARLY=pri_01yyyyy
```

### Backend (Python .env)
```env
# Paddle Webhooks
PADDLE_API_KEY=your_api_key_here
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxx

# Coinbase Commerce
COINBASE_API_KEY=your_coinbase_api_key
COINBASE_WEBHOOK_SECRET=your_webhook_secret

# Supabase (Service Role for writes)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Netlify Environment Variables
If deploying to Netlify, add these in the dashboard:
1. Go to Site Settings > Environment Variables
2. Add all the `VITE_*` variables for the frontend

---

## 4. Database Migration

Run the subscription system migration in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open and run: `supabase/migrations/20260204_subscription_system.sql`

This creates:
- `subscriptions` table
- `usage_tracking` table
- `webhook_events` table
- RLS policies
- Helper functions

---

## 5. Testing Checklist

### Paddle Sandbox Testing
- [ ] Initialize Paddle SDK in browser console
- [ ] Open checkout overlay for monthly plan
- [ ] Complete test payment (use Paddle test cards)
- [ ] Verify webhook received in Python backend logs
- [ ] Check subscription created in Supabase

### Coinbase Commerce Testing
- [ ] Create test charge via API
- [ ] Verify hosted checkout page opens
- [ ] Simulate confirmed payment webhook
- [ ] Check subscription activated in Supabase

### Feature Gating Testing
- [ ] Log in as free user
- [ ] Verify enhancement limit (20/month)
- [ ] Verify stems limited to 2
- [ ] Upgrade to premium
- [ ] Verify unlimited access granted

---

## 6. Going Live

When ready for production:

1. **Paddle**:
   - Complete business verification
   - Switch from Sandbox to Live mode
   - Create production products/prices
   - Update `VITE_PADDLE_ENV=production`
   - Update price IDs

2. **Coinbase Commerce**:
   - Ensure verification is complete
   - API keys work in production by default

3. **Update Webhook URLs**:
   - Point to your production backend URL

4. **Test with real small payments** before full launch

---

## Support Resources

- [Paddle Documentation](https://developer.paddle.com/)
- [Coinbase Commerce API](https://docs.cloud.coinbase.com/commerce/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
