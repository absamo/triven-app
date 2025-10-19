# Email Template System Usage Guide

The Triven app now includes a comprehensive internationalized email template system for subscription management. Here's how to use it effectively.

## 📧 Available Email Templates

### 1. Trial Welcome Email (`FreeTrialWelcome`)
**When to send:** When a user starts a free trial
**Triggers:** Subscription creation with status 'trialing'

```typescript
import { sendTrialWelcomeEmail } from '~/app/services/email.server'

await sendTrialWelcomeEmail({
  to: 'user@example.com',
  locale: 'en', // or 'fr'
  name: 'John Doe',
  trialEndDate: 'December 25, 2024',
  dashboardUrl: 'https://app.triven.com/dashboard',
})
```

### 2. Subscription Confirmation (`SubscriptionConfirmation`)
**When to send:** When a user successfully subscribes to a paid plan
**Triggers:** Subscription creation with status 'active'

```typescript
await sendSubscriptionConfirmationEmail({
  to: 'user@example.com',
  locale: 'en',
  name: 'John Doe',
  planName: 'Professional',
  planPrice: '$29',
  billingCycle: 'monthly',
  nextBillingDate: 'January 25, 2025',
  dashboardUrl: 'https://app.triven.com/dashboard',
  billingUrl: 'https://app.triven.com/billing',
})
```

### 3. Plan Upgrade (`PlanUpgrade`)
**When to send:** When a user upgrades their subscription plan
**Triggers:** Manual trigger from upgrade flow

```typescript
await sendPlanUpgradeEmail({
  to: 'user@example.com',
  locale: 'en',
  name: 'John Doe',
  oldPlan: 'Standard',
  newPlan: 'Professional',
  newPrice: '$29',
  billingCycle: 'monthly',
  upgradeDate: 'today',
  nextBillingDate: 'January 25, 2025',
})
```

### 4. Payment Method Update (`PaymentMethodUpdate`)
**When to send:** When a user updates their payment method
**Triggers:** Webhook `setup_intent.succeeded` with type 'payment_method_update'

```typescript
await sendPaymentMethodUpdateEmail({
  to: 'user@example.com',
  locale: 'en',
  name: 'John Doe',
  planName: 'Professional',
  newPaymentMethod: 'Visa',
  lastFour: '4242',
  updateDate: 'today',
  nextBillingDate: 'January 25, 2025',
  amount: '$29',
})
```

### 5. Payment Failed (`PaymentFailed`)
**When to send:** When a subscription payment fails
**Triggers:** Webhook `invoice.payment_failed`

```typescript
await sendPaymentFailedEmail({
  to: 'user@example.com',
  locale: 'en',
  name: 'John Doe',
  planName: 'Professional',
  amount: '$29',
  failureReason: 'Insufficient funds',
  nextAttemptDate: 'December 28, 2024',
  updatePaymentUrl: 'https://app.triven.com/billing',
})
```

### 6. Payment Success (`PaymentSuccess`)
**When to send:** When a subscription payment succeeds
**Triggers:** Webhook `invoice.payment_succeeded`

```typescript
await sendPaymentSuccessEmail({
  to: 'user@example.com',
  locale: 'en',
  name: 'John Doe',
  planName: 'Professional',
  amount: '$29',
  paymentDate: 'December 25, 2024',
  invoiceNumber: 'INV-001',
  invoiceUrl: 'https://invoice.stripe.com/...',
})
```

### 7. Trial Expiring (`TrialExpiring`)
**When to send:** 3 days and 1 day before trial expires
**Triggers:** Scheduled cron job `/api/cron/trial-expiring-emails`

```typescript
await sendTrialExpiringEmail({
  to: 'user@example.com',
  locale: 'en',
  name: 'John Doe',
  daysLeft: 3,
  expirationDate: 'December 28, 2024',
  planRecommendation: 'Professional',
  planPrice: '$29',
  upgradeUrl: 'https://app.triven.com/billing/upgrade',
})
```

### 8. Subscription Cancelled (`SubscriptionCancelled`)
**When to send:** When a user cancels their subscription
**Triggers:** Webhook `customer.subscription.deleted`

```typescript
await sendSubscriptionCancelledEmail({
  to: 'user@example.com',
  locale: 'en',
  name: 'John Doe',
  planName: 'Professional',
  cancellationDate: 'December 25, 2024',
  endDate: 'January 25, 2025',
  reason: 'At your request',
  reactivateUrl: 'https://app.triven.com/billing/reactivate',
})
```

## 🔄 Automatic Email Triggers

The email system is integrated with your Stripe webhooks and subscription management:

### Webhook Events
- `invoice.payment_succeeded` → Payment Success Email
- `invoice.payment_failed` → Payment Failed Email
- `setup_intent.succeeded` (payment_method_update) → Payment Method Update Email
- `customer.subscription.deleted` → Subscription Cancelled Email

### API Events
- Subscription creation → Trial Welcome Email (trialing) or Subscription Confirmation Email (active)

### Scheduled Events
- Daily cron job → Trial Expiring Emails (3 days and 1 day before expiry)

## 🌐 Internationalization

All templates support English and French:

```typescript
// English (default)
await sendTrialWelcomeEmail({
  to: 'user@example.com',
  locale: 'en',
  // ...
})

// French
await sendTrialWelcomeEmail({
  to: 'user@example.com',
  locale: 'fr',
  // ...
})
```

## ⚙️ Configuration

### Environment Variables
```env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=Triven <onboarding@triven.app>
BASE_URL=https://app.triven.com
```

### Setting up Cron Jobs

#### Option 1: GitHub Actions (Recommended)
Create `.github/workflows/trial-expiring-emails.yml`:

```yaml
name: Send Trial Expiring Emails
on:
  schedule:
    - cron: '0 10 * * *' # Daily at 10 AM UTC
jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Send Trial Expiring Emails
        run: |
          curl -X POST https://app.triven.com/api/cron/trial-expiring-emails \\
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option 2: Vercel Cron
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-expiring-emails",
      "schedule": "0 10 * * *"
    }
  ]
}
```

#### Option 3: External Cron Service
Use services like cron-job.org to POST to:
`https://app.triven.com/api/cron/trial-expiring-emails`

## 🔧 Customization

### Adding New Email Templates
1. Create the template in `app/emails/`
2. Add exports to `app/emails/index.ts`
3. Create email function in `app/services/email.server.ts`
4. Add translations to `app/locales/en/emails.ts` and `app/locales/fr/emails.ts`

### Modifying Existing Templates
- Edit the React Email components in `app/emails/`
- Update translations in `app/locales/*/emails.ts`
- Styling is inline CSS for maximum email client compatibility

### Custom Triggers
Add email sending to your business logic:

```typescript
import { sendTrialWelcomeEmail } from '~/app/services/email.server'

// In your subscription logic
if (subscriptionStatus === 'trialing') {
  await sendTrialWelcomeEmail({
    to: user.email,
    locale: await getUserLocale(user.id),
    name: user.name,
    trialEndDate: formatDate(trialEnd, locale),
  })
}
```

## 📊 Monitoring

Check email sending status in your application logs:
- ✅ Success messages for sent emails
- ❌ Error messages for failed emails (emails failures don't break core functionality)

## 🚀 Testing

### Development Testing
```bash
# Test cron endpoint
curl -X POST http://localhost:3000/api/cron/trial-expiring-emails

# Check email templates in React Email
npx react-email dev
```

### Production Testing
- Use Stripe test mode webhooks
- Set up email testing with Resend's test mode
- Monitor webhook delivery in Stripe Dashboard

## 🔐 Security

- The cron endpoint should be protected in production
- Use environment variables for sensitive data
- Consider IP allowlisting for webhook endpoints
- Implement rate limiting for email sending

## 📝 Best Practices

1. **Email Delivery**: Monitor bounce rates and spam complaints
2. **Localization**: Always fetch user locale before sending emails
3. **Error Handling**: Never let email failures break core functionality
4. **Content**: Keep email content concise and actionable
5. **Testing**: Test all email templates in different email clients
6. **Performance**: Send emails asynchronously to avoid blocking requests

This email system provides a complete subscription lifecycle communication strategy while maintaining professional branding and international accessibility.