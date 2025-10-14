# Testing Payment Failure Access Control

## Overview
This guide shows you how to test the payment failure blocking system that prevents users from accessing the app when their payment method has issues.

## Prerequisites
- Stripe webhook listener running: `bun run stripe:listen`
- Development server running: `bun run dev`
- Stripe test mode enabled

## Test Scenarios

### 1. Test Insufficient Funds (Past Due Status)

#### Option A: Using Stripe Dashboard (Easiest)
1. **Create a subscription** with a test card (e.g., `4242424242424242`)
2. **Go to Stripe Dashboard** → Subscriptions → Select your subscription
3. **Click "..." menu** → "Update subscription"
4. **Manually set status to "past_due"**
5. **Refresh your app** - you should be blocked with "Payment Failed" modal
6. **Click "Update Payment Method"**
7. **Enter a valid test card** (e.g., `4242424242424242`)
8. **Verify access is restored** after update

#### Option B: Using Stripe CLI (More Realistic)
1. **Create subscription** with valid card
2. **Trigger payment failure** via Stripe CLI:
   ```bash
   # Get the latest invoice ID
   stripe invoices list --subscription sub_xxx --limit 1
   
   # Manually fail the invoice
   stripe invoices pay inv_xxx --simulate-payment-failed
   ```
3. **Webhook updates subscription** to `past_due`
4. **Refresh app** - modal should block access
5. **Update payment method** to restore access

#### Option C: Using Stripe Test Cards for Automatic Failure
1. **Create subscription with a card that will fail on next charge:**
   - Use card: `4000000000000341` (always declines)
   - Or card: `4000000000009995` (insufficient funds)
2. **Wait for next billing cycle** (or manually create invoice)
3. **Payment will fail automatically**
4. **Webhook updates status to `past_due`**
5. **User is blocked** on next login/page refresh

### 2. Test Unpaid Status (Multiple Failures)

#### Using Stripe Dashboard:
1. **Create a subscription** that's already in `past_due` status
2. **Let Stripe retry payment** (or manually retry in dashboard)
3. **Each retry fails** → eventually becomes `unpaid`
4. **In Stripe Dashboard**, manually set status to `unpaid`:
   - Subscriptions → Select subscription → "..." → Update status
5. **Refresh your app** - blocked with "Payment Declined" modal
6. **Update payment method** to restore access

### 3. Test Expired Card Scenario

1. **Create subscription** with card `4000000000000069` (expired card)
2. **Payment will fail** with card expired error
3. **Webhook updates subscription** to `past_due`
4. **User sees modal** mentioning expired card
5. **Update with valid card** to restore access

### 4. Test Card Declined Scenario

1. **Use card `4000000000000002`** (card declined)
2. **Create subscription** - payment fails
3. **Subscription goes to `past_due`**
4. **User blocked** with appropriate message
5. **Update payment method** to continue

## Stripe Test Cards Reference

### Success Cards
- `4242424242424242` - Always succeeds
- `5555555555554444` - Mastercard, always succeeds

### Failure Cards
- `4000000000000002` - Card declined
- `4000000000009995` - Insufficient funds
- `4000000000000069` - Expired card
- `4000000000000127` - Incorrect CVC
- `4000000000000341` - Attaching card succeeds, but payments fail

### For Testing Specific Scenarios
- `4000002500003155` - Requires 3D Secure authentication
- `4000008260003178` - Charge succeeds but dispute created

## Manual Database Testing

If you want to test without Stripe webhooks:

```typescript
// In Prisma Studio or direct SQL
// Update subscription status to test different scenarios

// Test past_due
UPDATE "Subscription" 
SET status = 'past_due' 
WHERE "userId" = 'your-user-id';

// Test unpaid
UPDATE "Subscription" 
SET status = 'unpaid' 
WHERE "userId" = 'your-user-id';
```

Then refresh the app to see the blocking modal.

## Testing Workflow

### Step-by-Step Test Flow:

1. **Setup Test User**
   ```bash
   # Create test user via signup
   # URL: http://localhost:3000/auth/signup
   ```

2. **Subscribe to Plan**
   ```bash
   # Use valid test card: 4242424242424242
   # Complete subscription flow
   ```

3. **Verify Active Subscription**
   ```bash
   # Check in Stripe Dashboard
   # Check in Prisma Studio: status = 'active'
   # User should have full app access
   ```

4. **Simulate Payment Failure**
   ```bash
   # Option 1: Update in Stripe Dashboard
   # Option 2: Use Stripe CLI
   stripe subscriptions update sub_xxx --cancel-at-period-end=false
   stripe invoices create --customer cus_xxx
   stripe invoices pay inv_xxx --simulate-payment-failed
   
   # Option 3: Update database directly
   # In Prisma Studio: change status to 'past_due'
   ```

5. **Verify Blocking Behavior**
   - Refresh the app (or logout/login)
   - Non-dismissible modal should appear
   - Should show "Payment Failed" or "Payment Declined"
   - User cannot access any app functionality
   - Modal explains the issue (insufficient funds, expired card, etc.)

6. **Test Payment Method Update**
   - Click "Update Payment Method" button
   - PaymentMethodEditModal should open
   - Enter new test card: `4242424242424242`
   - Click "Update Card"
   - Should show processing state

7. **Verify Access Restoration**
   - Page should reload automatically
   - Subscription status should be updated (check webhook logs)
   - User should regain full access
   - Modal should close

8. **Verify Webhook Processing**
   ```bash
   # In webhook listener terminal, you should see:
   # ✓ invoice.payment_failed event received
   # ✓ Subscription status updated to past_due
   # ✓ setup_intent.succeeded event received
   # ✓ Payment method updated
   # ✓ Payment retried and succeeded
   # ✓ invoice.payment_succeeded event received
   # ✓ Subscription status updated to active
   ```

## Testing Checklist

### Before Testing
- [ ] Webhook listener is running (`bun run stripe:listen`)
- [ ] Development server is running (`bun run dev`)
- [ ] Stripe is in test mode
- [ ] Database is accessible (Prisma Studio)

### Functional Tests
- [ ] User with `past_due` status is blocked from app
- [ ] User with `unpaid` status is blocked from app
- [ ] Modal is non-dismissible (cannot close without action)
- [ ] "Update Payment Method" button opens PaymentMethodEditModal
- [ ] Can successfully update payment method with new card
- [ ] Page reloads automatically after successful update
- [ ] Subscription status updates to `active` after update
- [ ] User regains full app access after update

### UI/UX Tests
- [ ] Modal shows correct title ("Payment Failed" or "Payment Declined")
- [ ] Message clearly explains the issue
- [ ] Message mentions possible causes (insufficient funds, expired card)
- [ ] Loading states work correctly during update
- [ ] Success feedback is shown after update
- [ ] Error handling works if update fails

### Webhook Tests
- [ ] `invoice.payment_failed` webhook updates subscription to `past_due`
- [ ] `setup_intent.succeeded` webhook updates payment method
- [ ] `invoice.payment_succeeded` webhook updates subscription to `active`
- [ ] Database reflects webhook changes accurately
- [ ] Webhook logs are comprehensive and useful

### Edge Cases
- [ ] User with no subscription data doesn't crash
- [ ] Multiple failed payment methods are handled
- [ ] Concurrent payment attempts are handled
- [ ] Race conditions between webhooks are handled

## Monitoring During Testing

### Terminal Windows to Watch:

1. **Development Server**
   ```bash
   bun run dev
   # Watch for: loader execution, component rendering, error logs
   ```

2. **Stripe Webhook Listener**
   ```bash
   bun run stripe:listen
   # Watch for: webhook events, payment failures, status updates
   ```

3. **Browser Console**
   ```javascript
   // Watch for: API calls, errors, state updates
   // Should see: subscription status logs, modal open/close events
   ```

4. **Network Tab**
   ```
   Watch for:
   - POST /api/payment-method-update (SetupIntent creation)
   - POST /api/payment-method-update (confirmation)
   - Loader requests after page reload
   ```

## Expected Console Logs

### When Payment Fails (Webhook):
```
💸 Invoice payment failed: inv_xxx
   Subscription: sub_xxx
   Customer: cus_xxx
   Amount due: 2000
📊 Subscription status after payment failure: past_due
🔄 Updated subscription sub_xxx status to past_due for user user_xxx
```

### When User Opens App:
```
🔍 Layout: User planStatus = past_due
📋 SubscriptionStatusModal: Opened with mode = past_due
💳 Showing PaymentMethodEditModal
```

### When Payment Method Updated:
```
💳 Creating SetupIntent for payment method update
✅ SetupIntent confirmed successfully
🎉 PaymentMethodEditModal: Payment method update succeeded
🔄 Layout: Force reloading to refresh subscription status
```

### After Successful Update (Webhook):
```
💳 SetupIntent succeeded: seti_xxx
📊 Payment method updated for subscription sub_xxx
🔄 Retrying failed invoice inv_xxx
💰 Invoice payment succeeded: inv_xxx
📊 Subscription status: active
🔄 Updated subscription sub_xxx status to active
```

## Troubleshooting

### Modal Not Showing
- Check subscription status in database
- Verify loader is fetching subscription data
- Check Layout component is passing subscription to modal
- Look for console errors

### Payment Method Update Fails
- Check Stripe API keys are correct
- Verify webhook listener is running
- Check SetupIntent creation succeeds
- Look at network tab for API errors

### Status Not Updating After Update
- Verify webhooks are being received
- Check webhook handler is processing events
- Ensure database is being updated
- Look at webhook listener logs

### Access Not Restored
- Verify subscription status is `active` in database
- Check page reload occurred
- Clear browser cache and reload
- Check for JavaScript errors

## Quick Test Script

Here's a quick script to test the entire flow:

```bash
#!/bin/bash
# test-payment-failure.sh

echo "🧪 Testing Payment Failure Access Control"
echo ""

echo "1️⃣ Starting webhook listener..."
bun run stripe:listen &
WEBHOOK_PID=$!
sleep 3

echo "2️⃣ Getting test subscription..."
SUB_ID="sub_xxx" # Replace with your test subscription ID

echo "3️⃣ Simulating payment failure..."
stripe subscriptions update $SUB_ID --default-payment-method=pm_card_visa_chargeDeclined

echo "4️⃣ Creating and failing invoice..."
INVOICE_ID=$(stripe invoices create --customer cus_xxx --subscription $SUB_ID --auto-advance=false --format=json | jq -r '.id')
stripe invoices finalize $INVOICE_ID
stripe invoices pay $INVOICE_ID --simulate-payment-failed

echo "5️⃣ Waiting for webhook processing..."
sleep 2

echo "6️⃣ Checking subscription status..."
stripe subscriptions retrieve $SUB_ID --format=json | jq '.status'

echo ""
echo "✅ Test setup complete!"
echo "👉 Now refresh your app at http://localhost:3000"
echo "👉 You should see the blocking modal"
echo ""
echo "Press Ctrl+C to stop webhook listener"
wait $WEBHOOK_PID
```

## Success Criteria

The test is successful when:
1. ✅ User with failed payment is **completely blocked** from app
2. ✅ Modal clearly explains the **payment failure reason**
3. ✅ User **must update payment method** to continue
4. ✅ Payment method update **succeeds with new card**
5. ✅ Subscription status **automatically updates to active**
6. ✅ User **regains full access** immediately after update
7. ✅ All webhooks are **processed correctly**
8. ✅ Database reflects **accurate subscription state**

Happy testing! 🎉
