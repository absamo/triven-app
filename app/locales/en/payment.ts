export default {
  // Payment modal
  payment: 'Payment',
  upgradeTo: 'Upgrade to {{planName}}',
  upgradeToTitle: 'Upgrade to {{planName}}',
  subscribeTo: 'Subscribe to {{planName}}',
  setupPayment: 'Setting up payment...',
  loadingPaymentForm: 'Loading payment form...',

  // Payment form
  processing: 'Processing...',
  pay: 'Pay',
  paymentInformation: 'Payment Information',
  securePayment: 'Your payment information is secure and encrypted by Stripe',

  // Payment states
  paymentFailed: 'Payment Failed',
  paymentSuccessful: 'Payment Successful!',
  welcomeMessage: 'Welcome to {{planName}}! Your account has been upgraded.',
  paymentError: 'Something went wrong with your payment',

  // Subscription info
  cancelAnytime: 'You can cancel your subscription at any time from your account settings',
  proratedDifference:
    "You'll be charged the prorated difference for the remainder of your billing cycle.",
  trialEndsBilling: 'Your trial will end and billing will start immediately.',

  // Trial modal specific
  trialPeriodExpired: 'Trial Period Expired',
  subscriptionIncomplete: 'Subscription Incomplete',
  completePaymentRequired: 'Payment required to activate your subscription',
  incompleteSubscriptionMessage:
    'Your subscription is pending payment completion. Complete your payment to continue using all features.',
  trialExpiring: 'Your trial is expiring',
  trialExpired: 'Your trial has expired',
  cannotAccessTriven: 'You cannot access Triven please upgrade',
  trialEndedMessage:
    'Your free trial has ended. Upgrade to continue enjoying all the powerful inventory management features that make your business more efficient.',
  choosePlan: 'Choose a plan to continue using Triven',
  continueWithPlan: 'Continue with {{planName}}',
  flexiblePricing: 'Choose from flexible pricing plans that fit your business needs',

  // Error handling
  setupFailed: 'Setup Failed',
  unableToSetupPayment: 'Unable to setup payment. Please try again.',
  authenticationRequired: 'Authentication required. Please refresh the page and try again.',
  invalidPaymentConfig: 'Invalid payment configuration. Please contact support.',
  userSessionExpired: 'User session expired. Please refresh the page and try again.',

  // Billing
  monthly: 'Monthly',
  yearly: 'Yearly',
  billed: 'billed',
  perMonth: 'per month',
  perYear: 'per year',

  // Subscription cancellation
  cancelSubscription: 'Cancel Subscription',
  confirmCancellation: 'Confirm Cancellation',
  cancellationWarning: 'Are you sure you want to cancel your subscription?',
  cancelAtPeriodEnd: 'Cancel at period end',
  cancelImmediately: 'Cancel immediately',
  cancelAtPeriodEndDescription:
    'Your subscription will remain active until {{date}}, then be cancelled',
  cancelImmediatelyDescription:
    'Your subscription will be cancelled immediately and you will lose access now',
  cancellationReason: 'Reason for cancellation (optional)',
  subscriptionCancelled: 'Subscription Cancelled',
  subscriptionCancelledSuccessfully: 'Your subscription has been cancelled successfully',
  subscriptionScheduledForCancellation:
    'Your subscription is scheduled for cancellation at the end of your billing period',
  keepSubscription: 'Keep Subscription',
  proceedWithCancellation: 'Proceed with Cancellation',
  subscriptionEnding: 'Subscription Ending',
  accessUntil: 'You will have access until',

  // Payment method editing
  updatePaymentMethod: 'Update Payment Method',
  editPaymentMethod: 'Edit Payment Method',
  paymentMethodUpdated: 'Payment Method Updated',
  updatePaymentMethodInfo: 'Update Payment Method',
  updatePaymentMethodDescription:
    'Add a new payment method for your subscription. Your current payment method will be replaced.',
  enterNewPaymentMethod: 'Enter your new payment method',
  paymentCard: 'Payment Card',

  // Settings page translations
  subscriptions: 'Subscriptions',
  manageSubscriptions: 'Manage your subscription and billing settings',
  yourCurrentPlan: 'Your current plan',
  plan: 'plan',
  billedEveryMonth: 'billed every month',
  noActiveBilling: 'No active billing',
  status: 'Status',
  noActiveSubscription: 'No Active Subscription',
  renews: 'Renews',
  trialEndsOn: 'Trial ends on',
  nextInvoiceDue: 'Next invoice due on',
  noRenewalDate: 'No renewal date available',
  expires: 'Expires',
  upgrade: 'Upgrade',
  subscribe: 'Subscribe',
  viewPlans: 'View Plans',
  currency: 'Currencies',
  manageCurrencies: 'Manage your currencies',

  // Subscription status translations
  subscriptionStatus: {
    active: 'Active',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Incomplete Expired',
    past_due: 'Past Due',
    paused: 'Paused',
    trialing: 'Trial',
    unpaid: 'Unpaid',
  },
}
