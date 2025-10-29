export default {
  // Payment modal
  payment: 'Payment',
  upgradePlan: 'Upgrade',
  upgradeTo: 'Upgrade to {{planName}}',
  upgradeToTitle: 'Upgrade to {{planName}}',
  upgradeDescription: 'Upgrade your subscription to unlock premium features',
  subscribeTo: 'Subscribe to {{planName}}',
  setupPayment: 'Setting up payment...',
  loadingPaymentForm: 'Loading payment form...',

  // Payment form
  processing: 'Processing...',
  pay: 'Pay',
  paymentInformation: 'Payment Information',
  securePayment: 'Your payment information is secure and encrypted by Stripe',

  // Payment states
  paymentSuccessful: 'Payment Successful!',
  welcomeMessage: 'Welcome to {{planName}}! Your account has been upgraded.',
  paymentError: 'Something went wrong with your payment',

  // Subscription info
  price: 'Price',
  cancelAnytime: 'You can cancel your subscription at any time from your account settings',
  proratedDifference:
    "You'll be charged the prorated difference for the remainder of your billing cycle.",
  trialEndsBilling: 'Your trial will end and billing will start immediately.',

  // Trial modal specific
  trialPeriodExpired: 'Trial Period Expired',
  trialExpiring: 'Your trial is expiring',
  trialExpired: 'Your trial has expired',
  trialEndedMessage:
    'Your free trial has ended. Upgrade to continue enjoying all the powerful inventory management features that make your business more efficient.',
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
  month: 'month',
  year: 'year',
  trial: 'Trial',
  currentPlan: 'Current',
  upgradingTo: 'Upgrading to',
  dueToday: 'Due today',
  proratedUpgrade: 'Prorated Upgrade',
  proratedUpgradeDescription: 'Pay difference for remaining billing period',
  proratedUpgradeTrialDescription: 'Pay difference for remaining period',
  startSubscription: 'Start Subscription',
  paymentDetails: 'Payment Details',

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
  subscriptionCancelledSuccessfully: 'Your subscription has been cancelled successfully',
  subscriptionScheduledForCancellation:
    'Your subscription is scheduled for cancellation at the end of your billing period',
  keepSubscription: 'Keep Subscription',
  proceedWithCancellation: 'Proceed with Cancellation',
  subscriptionEnding: 'Subscription Ending',
  accessUntil: 'You will have access until',
  annualSubscriptionNotice: 'Annual Subscription',
  annualSubscriptionCancellationPolicy:
    'Annual subscriptions can only be cancelled at the end of the billing period. You will continue to have access until {{date}}.',

  // Payment method editing
  editPaymentMethod: 'Edit Payment Method',
  paymentMethodUpdated: 'Payment Method Updated',
  updatePaymentMethodInfo: 'Update Payment Method',
  updatePaymentMethodDescription:
    'Add a new payment method for your subscription. Your current payment method will be replaced.',
  enterNewPaymentMethod: 'Enter your new payment method',
  paymentCard: 'Payment Card',
  paymentMethod: 'Payment Method',
  useNewCard: 'Use a different card',
  cardExpired: 'Card Expired',
  cardExpiredMessage: 'Your payment card has expired. Please add a new card to continue.',
  confirmUpgrade: 'Confirm Upgrade',

  // Payment Failures and Card Issues
  paymentFailed: 'Payment Failed',
  paymentDeclined: 'Payment Declined',
  updatePaymentMethod: 'Update Payment Method',
  pastDueMessage:
    'Your payment has failed. This could be due to insufficient funds, an expired card, or other payment issues. Please update your payment method to restore access.',
  unpaidMessage:
    'Multiple payment attempts have failed. Your card may have insufficient funds, be expired, or been declined. Please update your payment method immediately to restore access.',
  insufficientFunds: 'Insufficient Funds',
  cardExpiredTitle: 'Card Expired',
  cardDeclined: 'Card Declined',
  paymentMethodRequired: 'Payment Method Required',
  accessBlocked: 'Access Blocked Due to Payment Issues',
  updateCardToRestore: 'Update your card to restore access to your account',

  // Settings page translations
  subscription: 'Subscription',
  subscriptions: 'Subscriptions',
  manageSubscription: 'Manage subscription',
  manageSubscriptions: 'Manage your subscription and billing settings',
  yourCurrentPlan: 'View and manage your subscription details',
  plan: 'Current Plan',
  billedEveryMonth: 'billed every month',
  noActiveBilling: 'No active billing',
  status: 'Status',
  nextBilling: 'Next Billing',
  trialEnds: 'Trial Ends',
  memberSince: 'Member Since',
  recently: 'Recently',
  free: 'Free',
  securelyStored: 'Securely stored with Stripe',
  renews: 'Renews',
  trialEndsOn: 'Trial ends on',
  nextInvoiceDue: 'Next invoice due on',
  noRenewalDate: 'No renewal date available',
  expires: 'Expires',
  upgrade: 'Upgrade to',
  subscribe: 'Subscribe to',
  viewPlans: 'View Plans',
  currency: 'Currencies',
  manageCurrencies: 'Manage your currencies',

  // Subscription status messages
  subscriptionCancelled: 'Subscription Cancelled',
  subscriptionIncomplete: 'Subscription Incomplete',
  subscriptionExpired: 'Subscription Expired',
  subscriptionUnpaid: 'Subscription Unpaid',
  subscriptionPaused: 'Subscription Paused',
  noActiveSubscription: 'No Active Subscription',
  paymentPastDue: 'Payment Past Due',
  cannotAccessTriven: 'You cannot access Triven at this time.',

  // Subscription action messages
  subscriptionCancelledMessage:
    'Your subscription has been cancelled. Please reactivate your subscription to continue using Triven.',
  incompleteSubscriptionMessage:
    'Your subscription is pending payment completion. Complete your payment to continue using all features.',
  incompleteExpiredMessage:
    'Your subscription setup has expired. Please start a new subscription to continue using Triven.',
  pausedMessage:
    'Your subscription is currently paused. Please resume your subscription to continue using Triven.',
  noSubscriptionMessage:
    'You need an active subscription to access Triven. Please choose a plan to continue.',

  // Action buttons
  reactivateSubscription: 'Reactivate Subscription',
  completePayment: 'Complete Payment',
  startNewSubscription: 'Start New Subscription',
  resumeSubscription: 'Resume Subscription',
  updatePayment: 'Update Payment',
  choosePlan: 'Choose Plan',

  // Webhook error
  webhookError:
    'Unable to process payment at this time. Please try again or contact support if the issue persists.',

  // Stripe health check errors
  stripeUnavailable:
    'Payment service is temporarily unavailable. Please try again in a few moments.',
  connectionError:
    'Unable to connect to payment service. Please check your internet connection and try again.',
  webhookWarning:
    'Webhook listener may not be running. Please ensure "bun run stripe:listen" is active to receive payment events properly.',

  // Reactivation modal
  reactivateSubscriptionDescription:
    'Choose your plan to reactivate your subscription. You can select your previous plan or upgrade to a different one.',
  billingInterval: 'Billing Interval',
  save20Percent: 'Save 20%',
  selectPlan: 'Select Plan',
  previousPlan: 'Previous',
  reactivating: 'Reactivating...',
  reactivationFailed: 'Reactivation Failed',
  unableToReactivate: 'Unable to reactivate subscription. Please try again.',
  subscriptionReactivated: 'Subscription Reactivated',
  subscriptionReactivatedSuccess: 'Your subscription has been reactivated successfully.',

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
