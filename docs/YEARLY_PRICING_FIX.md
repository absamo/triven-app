# Yearly Pricing Fix - Annual Subscription Amounts

## Problem Identified

The yearly subscription prices in `PRICING_PLANS` were incorrectly set as **monthly rates** instead of **annual totals**. This caused Stripe to charge users only the monthly amount for the entire year.

### Example of the Issue:
- **Intended**: User pays $228/year ($19/month billed annually)
- **What was happening**: User pays $19/year (only $19 total!)

## Changes Made

### 1. Updated Pricing Plans (`app/modules/stripe/plans.ts`)

Changed yearly prices from monthly rates to full annual amounts:

```typescript
// BEFORE (WRONG):
[INTERVALS.YEARLY]: {
  [CURRENCIES.USD]: 1900,  // $19 - treated as yearly total by Stripe!
  [CURRENCIES.EUR]: 1900,
}

// AFTER (CORRECT):
[INTERVALS.YEARLY]: {
  [CURRENCIES.USD]: 22800,  // $228/year ($19/month × 12)
  [CURRENCIES.EUR]: 22800,
}
```

**Updated prices:**
- **Standard**: $228/year (was $19/year) - **$19/month** billed annually
- **Professional**: $348/year (was $29/year) - **$29/month** billed annually  
- **Premium**: $948/year (was $79/year) - **$79/month** billed annually

### 2. Updated Display Logic

Fixed multiple components to show monthly equivalent for yearly plans:

#### `app/pages/Pricing/Pricing.tsx`
```typescript
// Show monthly equivalent for yearly pricing
const price = isYearly ? yearly / 12 : monthly
```

#### `app/lib/hooks/useSubscription.ts`
```typescript
// Calculate savings correctly with yearly as annual total
const savings = monthlyTotal - yearlyPrice  // yearlyPrice is annual total
```

#### `app/components/PricingCard/PricingCard.tsx`
```typescript
// Display monthly equivalent for yearly plans
const displayPrice = interval === INTERVALS.YEARLY ? yearlyPrice / 12 : monthlyPrice
```

#### `app/common/helpers/payment.ts`
```typescript
// getYearlySavings already correct - yearlyPrice is annual total
const savings = yearlyCostIfMonthly - yearlyPrice
```

## Required Actions

### ⚠️ CRITICAL: You Must Re-Seed Stripe Prices

The Stripe price IDs in your database and Stripe Dashboard still have the **old incorrect amounts**. You need to:

1. **Delete existing Stripe prices** (or create new ones with different IDs)
2. **Run the Prisma seed** to create prices with correct amounts
3. **Update Stripe Dashboard** to use new price IDs

### Step-by-Step Process:

```bash
# 1. Backup your current database
pg_dump your_database > backup.sql

# 2. Delete existing Stripe prices (in Stripe Dashboard or via API)
# Or update the price IDs in plans.ts to create new ones

# 3. Run the seed to create correct prices
bun run prisma db seed

# 4. Verify in Stripe Dashboard that prices are correct:
# - Standard yearly: $228.00/year
# - Professional yearly: $348.00/year
# - Premium yearly: $948.00/year

# 5. Test subscription creation with yearly billing
```

### Alternative: Manual Stripe Dashboard Update

If you don't want to re-seed:

1. Go to Stripe Dashboard → Products
2. For each plan, create new yearly prices:
   - Standard: $228.00/year
   - Professional: $348.00/year
   - Premium: $948.00/year
3. Update the price IDs in `app/modules/stripe/plans.ts`:
```typescript
stripePriceIds: {
  [INTERVALS.YEARLY]: {
    [CURRENCIES.USD]: 'price_NEW_ID_HERE',
    [CURRENCIES.EUR]: 'price_NEW_ID_HERE',
  },
}
```

## Testing

After re-seeding, test the following:

### 1. Pricing Display
- [ ] Pricing page shows correct monthly equivalent for yearly plans
- [ ] "$19/month" displayed for Standard yearly (not "$228/month")
- [ ] Savings percentage calculated correctly

### 2. Subscription Creation
- [ ] Create a yearly subscription
- [ ] Verify invoice shows correct annual amount ($228, $348, or $948)
- [ ] Verify subscription.interval = "year" in Stripe

### 3. Cancellation
- [ ] Annual subscriptions can only be cancelled at period end
- [ ] Alert shows correct cancellation policy
- [ ] User retains access until end of annual period

### 4. Billing
- [ ] No monthly invoices generated for annual subscriptions
- [ ] User charged once per year
- [ ] Renewal invoice generated at end of year (not monthly)

## Impact on Existing Subscriptions

**Important:** Existing annual subscriptions with incorrect pricing will continue at their current rate until:
- They are cancelled
- They naturally renew (will use new price)
- You manually update them in Stripe Dashboard

Consider:
1. Identifying affected users (those with yearly subscriptions at wrong amount)
2. Communicating price corrections
3. Honoring existing rates until renewal or offering migration options

## Verification Checklist

- [ ] `PRICING_PLANS` has annual totals for yearly prices
- [ ] Stripe Dashboard shows correct annual amounts
- [ ] Pricing page displays monthly equivalent correctly
- [ ] Test subscription creation charges correct annual amount
- [ ] Annual cancellation policy enforced
- [ ] No monthly invoices for annual subscriptions
- [ ] Savings calculations are accurate

## Files Modified

1. `/app/modules/stripe/plans.ts` - Updated yearly prices to annual amounts
2. `/app/pages/Pricing/Pricing.tsx` - Fixed display logic (divide yearly by 12)
3. `/app/lib/hooks/useSubscription.ts` - Fixed savings calculation
4. `/app/components/PricingCard/PricingCard.tsx` - Show monthly equivalent
5. `/app/common/helpers/payment.ts` - Already correct (added comment)

## Reference

- Stripe Recurring Pricing: https://stripe.com/docs/billing/subscriptions/model
- When `interval: "year"`, `unit_amount` is charged once per year
- Display "per month" to users, but charge annual total to Stripe
