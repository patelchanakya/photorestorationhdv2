# Stripe Credit System Testing Checklist

## Pre-Testing Setup

### 1. Environment Variables
- [ ] Add Stripe keys to `.env.local`
- [ ] Add Stripe keys to Supabase Edge Functions environment
- [ ] Create webhook in Stripe Dashboard
- [ ] Get webhook secret and add to environment

### 2. Database Migration
- [ ] Run: `supabase db reset` or `supabase migration up`
- [ ] Verify `add_credits_from_purchase` function exists
- [ ] Check all tables are created correctly

### 3. Edge Functions Deployment
- [ ] Deploy: `supabase functions deploy stripe-checkout`
- [ ] Deploy: `supabase functions deploy stripe-webhook`
- [ ] Verify functions are accessible

### 4. Create Stripe Products
- [ ] Create 4 products in Stripe Dashboard (Try It, Small Batch, Family Album, Archive Pro)
- [ ] Update price IDs in `src/lib/stripe-config.ts`
- [ ] Update `CREDIT_MAPPING` in webhook function

## Testing Scenarios

### 1. **Authentication Flow**
- [ ] Visit home page when not logged in
- [ ] Verify pricing section shows "Get Started" buttons
- [ ] Click "Get Started" → redirects to registration
- [ ] Register/sign in successfully
- [ ] Verify pricing section now shows "Buy Credits" buttons

### 2. **Purchase Modal - UI Testing**
- [ ] Click "Buy Credits" from home page
- [ ] Verify modal opens with 4 pricing tiers
- [ ] Check "POPULAR" badge on Family Album (25 credits)
- [ ] Check "BEST VALUE" badge on Archive Pro (100 credits)
- [ ] Verify savings calculations are correct
- [ ] Test modal close functionality

### 3. **User Settings Page**
- [ ] Navigate to `/app/user-settings`
- [ ] Verify "Credit Management" section exists
- [ ] Check current credit balance displays correctly
- [ ] Click "Buy More Credits" → modal opens
- [ ] Verify "Purchase History" section (initially empty)

### 4. **Stripe Checkout Flow**
- [ ] Click any "Get Started" button in purchase modal
- [ ] Verify redirect to Stripe Checkout
- [ ] Check correct product name and price
- [ ] Test with test card: `4242 4242 4242 4242`
- [ ] Complete payment successfully

### 5. **Payment Success Handling**
- [ ] After successful payment, verify redirect to user-settings
- [ ] Check success message appears
- [ ] Verify credits are added to account
- [ ] Check purchase appears in purchase history
- [ ] Verify purchase record in database

### 6. **Webhook Processing**
- [ ] Check Supabase Edge Function logs for webhook processing
- [ ] Verify webhook signature validation works
- [ ] Test webhook with Stripe CLI: `stripe listen --forward-to your-webhook-url`
- [ ] Confirm `credit_purchases` table has new record
- [ ] Confirm `user_credits` table is updated correctly

### 7. **Error Handling**
- [ ] Test with declined card: `4000 0000 0000 0002`
- [ ] Verify error message shows correctly
- [ ] Test cancelled payment flow
- [ ] Check error handling for missing authentication
- [ ] Test with invalid price IDs

### 8. **Credit Deduction**
- [ ] Start a photo restoration process
- [ ] Verify credits are deducted correctly
- [ ] Check optimistic updates work
- [ ] Test insufficient credits scenario

### 9. **Edge Cases**
- [ ] Test multiple quick purchases (race conditions)
- [ ] Test webhook replay protection (duplicate session IDs)
- [ ] Test customer recovery logic in webhook
- [ ] Verify purchase history pagination (if > 10 purchases)

### 10. **Cross-browser Testing**
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Verify modal responsive design
- [ ] Check purchase flow on different screen sizes

## Verification Points

### Database Checks
```sql
-- Check user credits
SELECT * FROM user_credits WHERE user_id = 'USER_ID';

-- Check purchase history
SELECT * FROM credit_purchases WHERE user_id = 'USER_ID';

-- Check Stripe customer mapping
SELECT * FROM stripe_customers WHERE user_id = 'USER_ID';

-- Check order records
SELECT * FROM stripe_orders WHERE customer_id = 'CUSTOMER_ID';
```

### Stripe Dashboard Checks
- [ ] Payment shows as succeeded
- [ ] Customer is created correctly
- [ ] Webhook events are received
- [ ] No failed webhook deliveries

### Edge Function Logs
- [ ] Check for successful checkout session creation
- [ ] Verify webhook signature validation
- [ ] Confirm credit addition logs
- [ ] No error messages in logs

## Performance Testing

### 1. **Load Testing**
- [ ] Test multiple simultaneous purchases
- [ ] Verify webhook processing under load
- [ ] Check database performance with many records

### 2. **Response Times**
- [ ] Purchase modal opens quickly (< 200ms)
- [ ] Stripe checkout redirect is fast (< 500ms)
- [ ] Webhook processing completes quickly (< 2s)

## Security Testing

### 1. **Authentication**
- [ ] Cannot access purchase endpoints without auth
- [ ] Cannot purchase for other users
- [ ] Webhook signature validation prevents unauthorized calls

### 2. **Data Protection**
- [ ] User can only see their own purchase history
- [ ] Credit balances are properly isolated
- [ ] No sensitive data exposed in frontend

## Integration Testing

### 1. **Complete User Journey**
1. [ ] New user registration
2. [ ] First credit purchase
3. [ ] Photo restoration (credit deduction)
4. [ ] Additional credit purchase
5. [ ] View purchase history
6. [ ] Account management

### 2. **Admin Testing**
- [ ] Monitor webhook delivery success rate
- [ ] Check for failed payments and reasons
- [ ] Verify credit balances match purchase amounts

## Deployment Testing

### 1. **Production Environment**
- [ ] Switch to live Stripe keys
- [ ] Update webhook URL to production
- [ ] Test with real payment methods
- [ ] Verify all functions work in production

### 2. **Monitoring**
- [ ] Set up alerts for failed webhooks
- [ ] Monitor credit purchase success rates
- [ ] Track user conversion rates

## Test Cards for Different Scenarios

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Lost Card: 4000 0000 0000 9987
Stolen Card: 4000 0000 0000 9979
Expired Card: 4000 0000 0000 0069
Processing Error: 4000 0000 0000 0119
Require Authentication: 4000 0000 0000 3220
```

## Success Criteria

### 📋 **Must Pass All:**
- [ ] Users can successfully purchase credits
- [ ] Credits are added to accounts automatically
- [ ] Purchase history is accurate
- [ ] No duplicate charges occur
- [ ] Error handling works correctly
- [ ] Security measures are effective

### 🚀 **Ready for Production When:**
- [ ] All test scenarios pass
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Security audit completed
- [ ] Webhook delivery rate > 99%
- [ ] User experience is smooth

---

## Quick Test Command

Run this to verify your implementation:

```bash
# 1. Check Edge Functions
curl -X POST https://hhwugsiztorplhxztuei.supabase.co/functions/v1/stripe-checkout

# 2. Check Database Migration
supabase db diff

# 3. Test Webhook Endpoint  
curl -X POST https://hhwugsiztorplhxztuei.supabase.co/functions/v1/stripe-webhook
```

Complete this checklist to ensure your Stripe credit system is production-ready! ✨