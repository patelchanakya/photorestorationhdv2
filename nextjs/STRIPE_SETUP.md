# Stripe Integration Setup Guide

## Required Environment Variables

Your Stripe integration is now ready! You just need to configure the environment variables with your provided Stripe keys.

### 1. Local Development (.env.local)

Add these variables to your `.env.local` file:



### 3. Webhook Setup

1. **Create Stripe Webhook:**
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - URL: `https://hhwugsiztorplhxztuei.supabase.co/functions/v1/stripe-webhook`
   - Events to send:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

2. **Get Webhook Secret:**
   - After creating the webhook, click on it
   - In the "Signing secret" section, click "Reveal"
   - Copy the webhook secret (starts with `whsec_`)
   - Add it to your environment variables

### 4. Create Stripe Products

You need to create actual products in your Stripe Dashboard and update the price IDs:

1. **Go to Stripe Dashboard → Products**
2. **Create 4 products with these details:**

   **Product 1: Try It**
   - Name: Try It
   - Description: Test our AI restoration on one special photo
   - Price: $2.99 (one-time payment)
   - Copy the price ID and update `stripe-config.ts`

   **Product 2: Small Batch**
   - Name: Small Batch
   - Description: Perfect for a few important memories
   - Price: $5.99 (one-time payment)
   - Copy the price ID and update `stripe-config.ts`

   **Product 3: Family Album**
   - Name: Family Album
   - Description: Restore a complete photo collection
   - Price: $18.99 (one-time payment)
   - Copy the price ID and update `stripe-config.ts`

   **Product 4: Archive Pro**
   - Name: Archive Pro
   - Description: For photographers & large collections
   - Price: $49.99 (one-time payment)
   - Copy the price ID and update `stripe-config.ts`

3. **Update Price IDs in Code:**
   - Open `src/lib/stripe-config.ts`
   - Replace the placeholder price IDs with your actual Stripe price IDs
   - Update both `stripeProducts` array and `CREDIT_MAPPING` object

### 5. Deploy Edge Functions

Deploy your Supabase Edge Functions:

```bash
cd /Users/cp/Documents/GitHub/photorestorationhdv2
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

### 6. Run Database Migration

Apply the database migration for credit functions:

```bash
supabase db reset
# or apply specific migration
supabase migration up
```

## Testing the Integration

### 1. Test Purchase Flow
1. Sign in to your app
2. Go to User Settings or click "Buy Credits" 
3. Select a credit package
4. Complete test purchase using Stripe test card: `4242 4242 4242 4242`
5. Verify credits are added to your account

### 2. Test Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Require Authentication**: 4000 0000 0000 3220

### 3. Verify Webhook
- Check Supabase Edge Function logs
- Verify webhook events in Stripe Dashboard
- Confirm credits are added to database

## What's Already Implemented

✅ **Complete Database Schema**: All tables and relationships
✅ **Edge Functions**: Checkout and webhook processing
✅ **Frontend Components**: Purchase modal and user interface
✅ **Credit Management**: Add, deduct, and track credits
✅ **Purchase History**: User can view past purchases
✅ **Error Handling**: Comprehensive error handling and recovery
✅ **Security**: Row Level Security and proper authentication

## Production Checklist

Before going live:
- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook URL to production domain
- [ ] Test complete purchase flow with live keys
- [ ] Verify webhook signature validation
- [ ] Test credit deduction during photo processing

Your Stripe integration is production-ready once these environment variables are configured!